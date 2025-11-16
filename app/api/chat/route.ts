import { type NextRequest, NextResponse } from "next/server"
import {
  getTMDBRecommendations,
  getSpotifyRecommendations,
  getListenNotesRecommendations,
} from "@/lib/api-services-server"
import { analyzeNLP, generateResponse } from "@/lib/nlp-engine"

interface ConversationContext {
  userPreferences: Record<string, any>
  moodHistory: Array<{ mood: string; timestamp: Date }>
  contentPreferences: { movies?: string[]; music?: string[]; podcasts?: string[] }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    const nlpAnalysis = analyzeNLP(message)

    // Generate contextual response based on NLP analysis
    const response = generateResponse(nlpAnalysis, message)

    // Get recommendations if applicable
    const recommendations = []
    const contentType = nlpAnalysis.contentType

    if (contentType !== "none") {
      const moodProfile = {
        primary: nlpAnalysis.sentiment.emotion,
        energy: nlpAnalysis.sentiment.energy,
        intensity: nlpAnalysis.sentiment.intensity,
        confidence: nlpAnalysis.sentiment.confidence,
      }

      if (contentType === "movie" || contentType === "mixed") {
        const movieRecs = await getTMDBRecommendations(nlpAnalysis.sentiment.emotion, moodProfile)
        recommendations.push(...movieRecs.slice(0, 4))
      }

      if (contentType === "music" || contentType === "mixed") {
        const musicRecs = await getSpotifyRecommendations(nlpAnalysis.sentiment.emotion, moodProfile)
        recommendations.push(...musicRecs.slice(0, 4))
      }

      if (contentType === "podcast") {
        const podcastRecs = await getListenNotesRecommendations(nlpAnalysis.sentiment.emotion, moodProfile)
        recommendations.push(...podcastRecs.slice(0, 5))
      }
    }

    return NextResponse.json({
      response,
      recommendations: recommendations.slice(0, 12),
      moodData: {
        source: "chat",
        sentiment: nlpAnalysis.sentiment,
        intent: nlpAnalysis.intent,
        confidence: nlpAnalysis.confidence,
      },
      intent: nlpAnalysis.intent,
      confidence: nlpAnalysis.confidence,
      contentType,
    })
  } catch (error) {
    console.error("[v0] Chat error:", error)
    return NextResponse.json({
      response: "Sorry, I had a little hiccup. Could you try that again?",
      recommendations: [],
    })
  }
}
