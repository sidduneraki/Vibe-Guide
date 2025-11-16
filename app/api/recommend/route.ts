import { type NextRequest, NextResponse } from "next/server"
import { analyzeSentiment } from "@/lib/sentiment-analysis"
import {
  getTMDBRecommendations,
  getSpotifyRecommendations,
  getListenNotesRecommendations,
} from "@/lib/api-services-server"
import { getHybridRecommender } from "@/lib/hybrid-recommender"
import { movieDataset, userRatingsDataset } from "@/lib/movie-dataset"

const hybridRecommender = getHybridRecommender()
hybridRecommender.loadMovies(movieDataset as any)
hybridRecommender.loadUserRatings(userRatingsDataset)

export async function POST(request: NextRequest) {
  try {
    const { input, userId = "default-user", userHistory = [] } = await request.json()

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const sentimentResult = analyzeSentiment(input)

    const hybridMovieRecs = hybridRecommender.getRecommendations(userId, userHistory, 9)

    const moodProfile = {
      primary: sentimentResult.emotion,
      sentiment: sentimentResult.label,
      score: sentimentResult.score,
      confidence: sentimentResult.confidence,
      intensity: sentimentResult.intensity,
      energy: sentimentResult.energy,
      keywords: sentimentResult.keywords,
    }

    // Get recommendations from all sources
    const [movies, songs, podcasts] = await Promise.all([
      getTMDBRecommendations(sentimentResult.emotion, moodProfile),
      getSpotifyRecommendations(sentimentResult.emotion, moodProfile),
      getListenNotesRecommendations(sentimentResult.emotion, moodProfile),
    ])

    const allMovieRecs = [
      ...hybridMovieRecs.map((m) => ({
        id: `hybrid_${m.id}`,
        title: m.title,
        type: "movie",
        description: m.overview,
        image: m.poster_path,
        rating: m.rating,
        matchScore: 90 + Math.floor(Math.random() * 10),
        details: { genres: m.genres, director: m.director },
        externalLink: `https://www.imdb.com/find?q=${encodeURIComponent(m.title)}`,
      })),
      ...movies,
    ]

    const recommendations = [...allMovieRecs, ...songs, ...podcasts]

    return NextResponse.json({
      recommendations,
      moodData: moodProfile,
      sentiment: sentimentResult,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Recommendation error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations", details: String(error) }, { status: 500 })
  }
}
