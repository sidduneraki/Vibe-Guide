import { type NextRequest, NextResponse } from "next/server"

// In-memory feedback storage
const feedbackStore: any[] = []
const userProfiles: Map<string, any> = new Map()

export async function POST(request: NextRequest) {
  try {
    const { itemId, type, comment, moodContext, userId, itemTitle, contentType, companion } = await request.json()

    const id = userId || "anonymous_user"

    const feedback = {
      userId: id,
      itemId,
      itemTitle,
      type,
      contentType,
      comment,
      moodContext,
      companion,
      timestamp: new Date(),
      sessionId: `session_${Date.now()}`,
    }

    feedbackStore.push(feedback)

    // Update or create user profile
    let profile = userProfiles.get(id)

    if (profile) {
      profile.lastActive = new Date()
      profile.totalFeedback += 1
      profile.likes += type === "like" ? 1 : 0
      profile.dislikes += type === "dislike" ? 1 : 0
      if (companion) {
        if (!profile.companionFeedback) profile.companionFeedback = {}
        if (!profile.companionFeedback[companion]) {
          profile.companionFeedback[companion] = { likes: 0, dislikes: 0 }
        }
        profile.companionFeedback[companion].likes += type === "like" ? 1 : 0
        profile.companionFeedback[companion].dislikes += type === "dislike" ? 1 : 0
      }
    } else {
      profile = {
        userId: id,
        createdAt: new Date(),
        lastActive: new Date(),
        totalFeedback: 1,
        likes: type === "like" ? 1 : 0,
        dislikes: type === "dislike" ? 1 : 0,
        engagementScore: 0,
        favoriteGenres: {},
        favoriteArtists: {},
        favoriteHosts: {},
        dislikedGenres: {},
        moodPreferences: {},
        companionFeedback: companion
          ? {
              [companion]: {
                likes: type === "like" ? 1 : 0,
                dislikes: type === "dislike" ? 1 : 0,
              },
            }
          : {},
      }
      userProfiles.set(id, profile)
    }

    console.log("[v0] Feedback saved:", {
      userId: id,
      itemId,
      type,
      mood: moodContext?.primary,
      companion,
    })

    return NextResponse.json({
      success: true,
      message: "Feedback recorded successfully",
      userEngagement: {
        totalFeedback: profile.totalFeedback,
        likeRatio: profile.likes / Math.max(profile.totalFeedback, 1),
        lastFeedback: feedback.timestamp,
        companionStats: profile.companionFeedback,
      },
    })
  } catch (error) {
    console.error("Feedback error:", error)
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "anonymous_user"

    const userFeedback = feedbackStore.filter((f) => f.userId === userId).slice(-10)
    const profile = userProfiles.get(userId)

    return NextResponse.json({
      feedbackCount: userFeedback.length,
      profile,
      recentFeedback: userFeedback,
    })
  } catch (error) {
    console.error("Feedback retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve feedback" }, { status: 500 })
  }
}
