import { type NextRequest, NextResponse } from "next/server"
// In-memory analytics storage
const analyticsStore: any[] = []

export async function POST(request: NextRequest) {
  try {
    const { event, data, userId, sessionId } = await request.json()

    const analyticsEvent = {
      event,
      data,
      timestamp: new Date(),
      sessionId,
      userId,
    }

    analyticsStore.push(analyticsEvent)

    console.log("[v0] Analytics event tracked:", event)

    return NextResponse.json({
      success: true,
      eventTracked: event,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to track analytics" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overview"

    const insights: any = {}

    if (type === "overview" || type === "moods") {
      const moodCounts: any = {}
      analyticsStore
        .filter((e) => e.event === "recommendation_generated" && e.data?.mood)
        .forEach((e) => {
          const mood = e.data.mood
          if (!moodCounts[mood]) {
            moodCounts[mood] = { count: 0, totalScore: 0 }
          }
          moodCounts[mood].count++
          moodCounts[mood].totalScore += e.data.avgMatchScore || 0
        })

      insights.moodDistribution = Object.entries(moodCounts).map(([mood, data]: any) => ({
        _id: mood,
        count: data.count,
        avgMatchScore: data.totalScore / data.count,
      }))
    }

    return NextResponse.json({
      insights,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("Analytics retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve analytics" }, { status: 500 })
  }
}
