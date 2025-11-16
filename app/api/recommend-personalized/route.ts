import { type NextRequest, NextResponse } from "next/server"
import {
  getTMDBRecommendations,
  getSpotifyRecommendations,
  getListenNotesRecommendations,
} from "@/lib/api-services-server"
import { analyzeSentiment } from "@/lib/sentiment-analysis"

// In-memory user profiles storage
const userProfiles = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const { input, userId = "anonymous_user", userFeedbackHistory = [], companion } = await request.json()

    const sentimentResult = analyzeSentiment(input)
    const moodProfile = {
      primary: sentimentResult.emotion,
      sentiment: sentimentResult.label,
      score: sentimentResult.score,
      confidence: sentimentResult.confidence,
      intensity: sentimentResult.intensity,
      energy: sentimentResult.energy,
      keywords: sentimentResult.keywords,
    }

    let profile = userProfiles.get(userId)
    if (!profile) {
      profile = {
        userId,
        createdAt: new Date(),
        favoriteGenres: {},
        favoriteArtists: {},
        likedItems: [],
        dislikedItems: [],
        companionPreferences: {},
      }
      userProfiles.set(userId, profile)
    }

    userFeedbackHistory.forEach((feedback: any) => {
      if (feedback.type === "like") {
        if (!profile.likedItems.includes(feedback.itemId)) {
          profile.likedItems.push(feedback.itemId)
        }
      } else if (feedback.type === "dislike") {
        if (!profile.dislikedItems.includes(feedback.itemId)) {
          profile.dislikedItems.push(feedback.itemId)
        }
      }
    })

    if (companion) {
      if (!profile.companionPreferences[companion]) {
        profile.companionPreferences[companion] = { count: 0, moods: [] }
      }
      profile.companionPreferences[companion].count++
      profile.companionPreferences[companion].moods.push(moodProfile.primary)
    }

    // Get base recommendations from APIs
    const [movies, songs, podcasts] = await Promise.all([
      getTMDBRecommendations(moodProfile.primary, moodProfile),
      getSpotifyRecommendations(moodProfile.primary, moodProfile),
      getListenNotesRecommendations(moodProfile.primary, moodProfile),
    ])

    const personalizedMovies = applyPersonalization(movies, userFeedbackHistory, moodProfile, companion)
    const personalizedSongs = applyPersonalization(songs, userFeedbackHistory, moodProfile, companion)
    const personalizedPodcasts = applyPersonalization(podcasts, userFeedbackHistory, moodProfile, companion)

    // Return all personalized recommendations without limiting
    const allRecommendations = [...personalizedMovies, ...personalizedSongs, ...personalizedPodcasts]

    console.log("[v0] Personalized recommendations generated:", {
      userId,
      mood: moodProfile.primary,
      companion,
      profileLikes: profile.likedItems.length,
      profileDislikes: profile.dislikedItems.length,
      recommendationCount: allRecommendations.length,
      movies: personalizedMovies.length,
      songs: personalizedSongs.length,
      podcasts: personalizedPodcasts.length,
    })

    return NextResponse.json({
      recommendations: allRecommendations,
      moodData: moodProfile,
      personalizationScore: calculatePersonalizationScore(userFeedbackHistory),
      companion,
      userProfile: {
        totalLikes: profile.likedItems.length,
        totalDislikes: profile.dislikedItems.length,
        companionStats: profile.companionPreferences,
      },
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("[v0] Personalized recommendation error:", error)
    return NextResponse.json({ error: "Failed to generate personalized recommendations" }, { status: 500 })
  }
}

function applyPersonalization(
  recommendations: any[],
  feedbackHistory: any[],
  moodAnalysis: any,
  companion?: string,
): any[] {
  // Build preference maps
  const likedItems = new Set(feedbackHistory.filter((f: any) => f.type === "like").map((f: any) => f.itemId))
  const dislikedItems = new Set(feedbackHistory.filter((f: any) => f.type === "dislike").map((f: any) => f.itemId))

  // Companion-based adjustments
  const companionMultipliers: Record<string, any> = {
    alone: { movie: 1.0, song: 1.2, podcast: 1.1 },
    partner: { movie: 1.2, song: 1.1, podcast: 0.9 },
    friends: { movie: 1.1, song: 1.3, podcast: 1.0 },
    family: { movie: 1.3, song: 0.9, podcast: 1.0 },
    kids: { movie: 1.4, song: 1.0, podcast: 0.7 },
  }

  return recommendations
    .map((rec) => {
      let adjustedScore = rec.matchScore || 50

      if (likedItems.has(rec.id)) {
        adjustedScore *= 1.3
      }

      if (dislikedItems.has(rec.id)) {
        adjustedScore *= 0.7
      }

      if (companion && companionMultipliers[companion]) {
        const multiplier = companionMultipliers[companion][rec.type] || 1.0
        adjustedScore *= multiplier
      }

      const recentFeedback = feedbackHistory.filter(
        (f: any) => f.itemId === rec.id && new Date().getTime() - new Date(f.timestamp).getTime() < 24 * 60 * 60 * 1000,
      )
      if (recentFeedback.length > 0) {
        adjustedScore *= 1.1
      }

      return {
        ...rec,
        matchScore: Math.round(Math.min(adjustedScore, 100)),
        personalizationApplied: true,
        companionOptimized: !!companion,
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

function calculatePersonalizationScore(feedbackHistory: any[]): number {
  if (!feedbackHistory || feedbackHistory.length === 0) return 0
  const likes = feedbackHistory.filter((f: any) => f.type === "like").length
  const total = feedbackHistory.length
  return Math.round((likes / total) * 100)
}
