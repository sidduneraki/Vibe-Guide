import { type NextRequest, NextResponse } from "next/server"
import {
  getTMDBRecommendations,
  getSpotifyRecommendations,
  getListenNotesRecommendations,
} from "@/lib/api-services-server"

/**
 * Smart Surprise Me endpoint
 * Uses user history, preferences, and randomization for discovery
 */

interface SurpriseWeights {
  userPreferences: number // 40%
  contentDiversity: number // 30%
  trending: number // 20%
  randomDiscovery: number // 10%
}

export async function POST(request: NextRequest) {
  try {
    const { userHistory, userId } = await request.json()

    const weights: SurpriseWeights = calculateWeights(userHistory)

    const moodProfile = {
      primary: selectRandomMood(),
      energy: Math.random() * 100,
      intensity: Math.random() * 100,
      confidence: 70,
    }

    const recommendations = await fetchDiverseRecommendations(moodProfile, weights, userHistory)

    const movies = recommendations.filter((r) => r.type === "movie")
    const songs = recommendations.filter((r) => r.type === "song")
    const podcasts = recommendations.filter((r) => r.type === "podcast")

    // Take 5 from each category to ensure balance (15 total)
    const balancedRecommendations = [...movies.slice(0, 5), ...songs.slice(0, 5), ...podcasts.slice(0, 5)]

    console.log("[v0] Surprise - Final balanced output:", {
      movies: balancedRecommendations.filter((r) => r.type === "movie").length,
      songs: balancedRecommendations.filter((r) => r.type === "song").length,
      podcasts: balancedRecommendations.filter((r) => r.type === "podcast").length,
    })

    // Track surprise usage for analytics
    await trackSurpriseEvent(moodProfile, balancedRecommendations, userId)

    return NextResponse.json({
      recommendations: balancedRecommendations,
      moodData: {
        source: "surprise",
        selectedMood: moodProfile.primary,
        energy: Math.round(moodProfile.energy),
        intensity: Math.round(moodProfile.intensity),
        weights,
      },
      message: generateSurpriseMessage(moodProfile.primary),
    })
  } catch (error) {
    console.error("Surprise error:", error)
    return NextResponse.json({ error: "Failed to generate surprise" }, { status: 500 })
  }
}

function calculateWeights(userHistory: any[]): SurpriseWeights {
  // If user has lots of history, weight towards preferences more
  const historyLength = userHistory ? Object.keys(userHistory).length : 0
  const prefWeight = Math.min(40 + historyLength * 2, 60)

  return {
    userPreferences: prefWeight,
    contentDiversity: 50 - prefWeight * 0.25,
    trending: 20,
    randomDiscovery: 10,
  }
}

function selectRandomMood(): string {
  const moods = [
    "happy",
    "sad",
    "energetic",
    "relaxed",
    "thoughtful",
    "romantic",
    "focused",
    "adventurous",
    "peaceful",
    "excited",
  ]
  return moods[Math.floor(Math.random() * moods.length)]
}

async function fetchDiverseRecommendations(moodProfile: any, weights: SurpriseWeights, userHistory: any[]) {
  // Get recommendations from all three sources
  const [movies, songs, podcasts] = await Promise.all([
    getTMDBRecommendations(moodProfile.primary, moodProfile),
    getSpotifyRecommendations(moodProfile.primary, moodProfile),
    getListenNotesRecommendations(moodProfile.primary, moodProfile),
  ])

  console.log("[v0] Surprise - Movies count:", movies.length)
  console.log("[v0] Surprise - Songs count:", songs.length)
  console.log("[v0] Surprise - Podcasts count:", podcasts.length)

  let recommendations = [...movies, ...songs, ...podcasts]

  console.log("[v0] Surprise - Total recommendations before filtering:", recommendations.length)

  // Apply weighting based on user history
  recommendations = recommendations.map((rec) => {
    let weightedScore = rec.matchScore || 50

    // Check if user has interacted with this type before
    const typeCount = Object.values(userHistory || {}).filter((h: any) => h.type === rec.type).length

    // If they haven't seen many of this type, boost it (discovery)
    if (typeCount < 3) {
      weightedScore *= 1.2
    }

    // Add randomness for serendipity
    const randomBoost = (Math.random() - 0.5) * 20
    weightedScore += randomBoost

    return {
      ...rec,
      matchScore: Math.round(Math.max(0, Math.min(100, weightedScore))),
      surpriseSelected: true,
    }
  })

  // Shuffle and sort by weighted score
  return recommendations.sort(() => Math.random() - 0.5).sort((a, b) => b.matchScore - a.matchScore)
}

function generateSurpriseMessage(mood: string): string {
  const messages: Record<string, string[]> = {
    happy: [
      "Get ready to smile even bigger!",
      "I found something amazing that will make your day brighter!",
      "This should make you grin!",
    ],
    sad: [
      "I think this might help lift your spirits",
      "Sometimes the best comfort comes from unexpected places...",
      "Here's something that might resonate with you",
    ],
    energetic: ["Let's turn that energy UP!", "I found something to fuel your fire!", "This will keep you going!"],
    relaxed: [
      "Time to kick back and enjoy this...",
      "I found the perfect way to unwind...",
      "Let this melt away your stress...",
    ],
    thoughtful: [
      "Something that'll make you think...",
      "I found something introspective and beautiful...",
      "This might spark something interesting...",
    ],
    romantic: ["Feeling the romance?", "This should set the perfect mood...", "Something for the romantic at heart..."],
    focused: ["Stay in the zone with this...", "Perfect fuel for your focus...", "This will keep you locked in..."],
    adventurous: ["Ready for an adventure?", "I found something thrilling...", "Let's explore something new!"],
    peaceful: ["Pure serenity awaits...", "Something calming and beautiful...", "Peace and tranquility incoming..."],
    excited: ["Get hyped!", "This is going to blow your mind!", "Excitement incoming!"],
  }

  const moodMessages = messages[mood] || messages.happy
  return moodMessages[Math.floor(Math.random() * moodMessages.length)]
}

async function trackSurpriseEvent(moodProfile: any, recommendations: any[], userId?: string) {
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "surprise_me_triggered",
        data: {
          mood: moodProfile.primary,
          energy: moodProfile.energy,
          recommendationCount: recommendations.length,
          userId: userId || "anonymous",
          timestamp: new Date().toISOString(),
        },
      }),
    })
  } catch (error) {
    console.error("Failed to track surprise event:", error)
  }
}
