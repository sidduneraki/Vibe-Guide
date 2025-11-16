import { type NextRequest, NextResponse } from "next/server"
import { PodcastHybridRecommender } from "@/lib/podcast-hybrid-recommender"
import { analyzeSentiment } from "@/lib/sentiment-analysis"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 1, mood, text, emoji } = body

    let detectedMood = mood
    if ((text || emoji) && !mood) {
      const sentiment = analyzeSentiment(text || "", emoji || "")
      detectedMood = sentiment.emotion || "relaxed"
    }

    console.log("[v0] Podcast recommendation request:", { userId, mood: detectedMood })

    const recommender = new PodcastHybridRecommender(0.7, 0.3)
    const recommendations = recommender.getHybridRecommendations(userId, detectedMood, 10)

    console.log("[v0] Found", recommendations.length, "podcast recommendations")

    const formattedRecs = recommendations.map((rec) => ({
      id: `podcast_${rec.podcast.id}`,
      title: rec.podcast.title,
      type: "podcast",
      description: rec.podcast.description,
      image: rec.podcast.image,
      rating: rec.podcast.rating,
      matchScore: Math.round(rec.hybridScore * 100),
      details: {
        host: rec.podcast.host,
        episodes: rec.podcast.episodes,
        categories: rec.podcast.categories.join(", "),
        language: rec.podcast.language,
      },
      podcastLink: `https://www.apple.com/podcasts/search/${encodeURIComponent(rec.podcast.title)}`,
      hybridScores: {
        content: Math.round(rec.contentScore * 100),
        collaborative: Math.round(rec.collaborativeScore * 100),
        hybrid: Math.round(rec.hybridScore * 100),
      },
    }))

    return NextResponse.json({
      success: true,
      mood: detectedMood,
      recommendations: formattedRecs,
      algorithm: "Hybrid (Content-Based + Collaborative Filtering)",
    })
  } catch (error) {
    console.error("[v0] Podcast recommendation error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate podcast recommendations" }, { status: 500 })
  }
}
