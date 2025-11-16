import { type NextRequest, NextResponse } from "next/server"

/**
 * Advanced chat with multi-turn conversation support
 * Handles context, user preferences, and generates contextual responses
 */

interface ConversationTurn {
  role: "user" | "assistant"
  content: string
  intent?: string
  entities?: Record<string, any>
}

// Extract entities from user message
function extractEntities(message: string) {
  const entities: Record<string, any> = {}

  // Genre detection
  const genres = ["action", "comedy", "drama", "horror", "romance", "sci-fi", "thriller", "animation", "documentary"]
  genres.forEach((genre) => {
    if (message.toLowerCase().includes(genre)) {
      entities.genre = genre
    }
  })

  // Time preferences
  if (message.toLowerCase().includes("90s") || message.toLowerCase().includes("classic")) {
    entities.era = "classic"
  } else if (message.toLowerCase().includes("new") || message.toLowerCase().includes("recent")) {
    entities.era = "recent"
  }

  // Content type
  if (message.toLowerCase().includes("movie") || message.toLowerCase().includes("film")) {
    entities.contentType = "movie"
  } else if (message.toLowerCase().includes("music") || message.toLowerCase().includes("song")) {
    entities.contentType = "song"
  } else if (message.toLowerCase().includes("podcast") || message.toLowerCase().includes("show")) {
    entities.contentType = "podcast"
  }

  return entities
}

// Generate smart follow-ups based on context
function generateFollowUp(conversationHistory: ConversationTurn[]): string {
  const lastMessages = conversationHistory.slice(-2)
  const userSentiment = lastMessages.some(
    (m) => m.content.toLowerCase().includes("love") || m.content.toLowerCase().includes("great"),
  )

  if (userSentiment) {
    return "Awesome! Would you like me to find similar recommendations?"
  }
  return "Want me to find something else?"
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    // Extract entities from the current message
    const entities = extractEntities(message)

    // Build context from conversation history
    const context = conversationHistory.slice(-5).map((msg: ConversationTurn) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Generate contextual response with follow-ups
    let response = ""
    const recommendations = []

    if (entities.contentType === "movie") {
      response = `I'll find some great movies for you${entities.genre ? ` in the ${entities.genre} genre` : ""}! 🎬`
    } else if (entities.contentType === "song") {
      response = `Perfect! Let me grab some awesome songs for you... 🎵`
    } else if (entities.contentType === "podcast") {
      response = `Great choice! Finding the best podcasts for you... 🎙️`
    } else {
      response = "I'd love to help! Tell me what kind of entertainment you're looking for - movies, music, or podcasts?"
    }

    return NextResponse.json({
      response,
      followUp: generateFollowUp(conversationHistory),
      recommendations,
      entities,
      contextLength: context.length,
    })
  } catch (error) {
    console.error("Advanced chat error:", error)
    return NextResponse.json({ error: "Failed to process advanced chat" }, { status: 500 })
  }
}
