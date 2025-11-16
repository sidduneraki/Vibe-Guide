"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, Heart, ThumbsDown, Zap } from "lucide-react"

interface LearningStats {
  totalFeedback: number
  likes: number
  dislikes: number
  topGenres: string[]
  engagementScore: number
}

export default function LearningDashboard() {
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/feedback?userId=anonymous_user")
        const data = await response.json()

        // Calculate stats from feedback
        const feedback = data.recentFeedback || []
        const likes = feedback.filter((f: any) => f.type === "like").length
        const dislikes = feedback.filter((f: any) => f.type === "dislike").length

        setStats({
          totalFeedback: feedback.length,
          likes,
          dislikes,
          topGenres: ["Drama", "Action", "Comedy"],
          engagementScore: Math.round((likes / Math.max(feedback.length, 1)) * 100),
        })
      } catch (error) {
        console.error("Failed to fetch learning stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading || !stats) {
    return null
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-8">
      {/* Total Feedback */}
      <Card className="p-4 bg-white/10 border border-white/20 hover:border-white/40 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-semibold">Total Feedback</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalFeedback}</p>
          </div>
          <Zap className="w-8 h-8 text-yellow-400 opacity-50" />
        </div>
      </Card>

      {/* Likes */}
      <Card className="p-4 bg-white/10 border border-white/20 hover:border-white/40 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-semibold">Liked</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.likes}</p>
          </div>
          <Heart className="w-8 h-8 text-green-400 opacity-50" />
        </div>
      </Card>

      {/* Dislikes */}
      <Card className="p-4 bg-white/10 border border-white/20 hover:border-white/40 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-semibold">Disliked</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.dislikes}</p>
          </div>
          <ThumbsDown className="w-8 h-8 text-red-400 opacity-50" />
        </div>
      </Card>

      {/* Engagement Score */}
      <Card className="p-4 bg-white/10 border border-white/20 hover:border-white/40 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs font-semibold">Engagement</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.engagementScore}%</p>
          </div>
          <TrendingUp className="w-8 h-8 text-cyan-400 opacity-50" />
        </div>
      </Card>
    </div>
  )
}
