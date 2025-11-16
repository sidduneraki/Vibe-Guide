import { type NextRequest, NextResponse } from "next/server"
import { MusicHybridRecommender } from "@/lib/music-hybrid-recommender"
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

    console.log("[v0] Music recommendation request:", { userId, mood: detectedMood })

    const recommender = new MusicHybridRecommender(0.7, 0.3)
    const recommendations = recommender.getHybridRecommendations(userId, detectedMood, 10)

    console.log("[v0] Found", recommendations.length, "music recommendations")

    const formattedRecs = recommendations.map((rec) => ({
      id: `song_${rec.song.id}`,
      title: rec.song.title,
      type: "song",
      description: `${rec.song.artist} • ${rec.song.album} (${rec.song.releaseYear})`,
      image: rec.song.image,
      rating: rec.song.rating,
      matchScore: Math.round(rec.hybridScore * 100),
      details: {
        artist: rec.song.artist,
        album: rec.song.album,
        duration: `${Math.floor(rec.song.duration / 60)}:${(rec.song.duration % 60).toString().padStart(2, "0")}`,
        genres: rec.song.genres.join(", "),
        mood: rec.song.mood,
        energy: rec.song.energy,
        releaseYear: rec.song.releaseYear,
      },
      spotifyLink: rec.song.spotifyLink,
      previewUrl: rec.song.previewUrl,
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
    console.error("[v0] Music recommendation error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate music recommendations" }, { status: 500 })
  }
}
