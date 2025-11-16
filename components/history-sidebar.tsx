"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Clock,
  ThumbsUp,
  ThumbsDown,
  Film,
  Music,
  Podcast,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FeedbackRecord {
  userId: string
  itemId: string
  itemTitle: string
  type: "like" | "dislike" | "comment"
  contentType: "movie" | "song" | "podcast"
  timestamp: Date
  companion?: string
}

interface UserProfile {
  totalFeedback: number
  likes: number
  dislikes: number
  engagementScore: number
  companionFeedback?: Record<string, { likes: number; dislikes: number }>
}

export default function HistorySidebar() {
  const [recentFeedback, setRecentFeedback] = useState<FeedbackRecord[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/feedback?userId=anonymous_user")
        const data = await response.json()

        setRecentFeedback(data.recentFeedback || [])
        setProfile(data.profile)
      } catch (error) {
        console.error("Failed to fetch history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()

    // Refresh every 5 seconds to show new interactions
    const interval = setInterval(fetchHistory, 5000)
    return () => clearInterval(interval)
  }, [])

  const getContentIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="w-4 h-4" />
      case "song":
        return <Music className="w-4 h-4" />
      case "podcast":
        return <Podcast className="w-4 h-4" />
      default:
        return null
    }
  }

  const getContentColor = (type: string) => {
    switch (type) {
      case "movie":
        return "text-amber-400 border-amber-400/50"
      case "song":
        return "text-pink-400 border-pink-400/50"
      case "podcast":
        return "text-purple-400 border-purple-400/50"
      default:
        return "text-gray-400 border-gray-400/50"
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="w-80 bg-white/5 backdrop-blur-md border-l border-white/10 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-3/4" />
          <div className="h-20 bg-white/10 rounded" />
          <div className="h-20 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gradient-to-r from-cyan-400/90 to-blue-500/90 hover:from-cyan-500 hover:to-blue-600 text-white shadow-lg backdrop-blur-md"
      >
        <Clock className="w-4 h-4 mr-2" />
        History
        {isOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
      </Button>

      {isOpen && (
        <div className="mt-2 w-80 max-h-[calc(100vh-120px)] bg-gradient-to-b from-slate-950/95 to-purple-900/40 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2 bg-white/5 border-white/10">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs text-white/60">Likes</p>
                    <p className="text-lg font-bold text-green-400">{profile?.likes}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-2 bg-white/5 border-white/10">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs text-white/60">Dislikes</p>
                    <p className="text-lg font-bold text-red-400">{profile?.dislikes}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <ScrollArea className="h-[400px] p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recent Activity
              </h3>

              {recentFeedback.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs mt-1">Start rating content to see your history</p>
                </div>
              ) : (
                recentFeedback.map((item, index) => (
                  <Card
                    key={`${item.itemId}-${index}`}
                    className="p-3 bg-white/5 border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`p-1.5 rounded-full ${
                          item.type === "like"
                            ? "bg-green-500/20"
                            : item.type === "dislike"
                              ? "bg-red-500/20"
                              : "bg-blue-500/20"
                        }`}
                      >
                        {item.type === "like" ? (
                          <ThumbsUp className="w-3 h-3 text-green-400" />
                        ) : item.type === "dislike" ? (
                          <ThumbsDown className="w-3 h-3 text-red-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-blue-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.itemTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs px-1.5 py-0 ${getContentColor(item.contentType)}`}
                          >
                            {getContentIcon(item.contentType)}
                            <span className="ml-1 capitalize">{item.contentType}</span>
                          </Badge>
                          {item.companion && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 text-cyan-400 border-cyan-400/50">
                              <Users className="w-3 h-3 mr-1" />
                              {item.companion}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-1">{formatTimestamp(item.timestamp)}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {profile?.companionFeedback && Object.keys(profile.companionFeedback).length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Viewing Companions
                </h3>
                {Object.entries(profile.companionFeedback).map(([companion, stats]) => (
                  <Card key={companion} className="p-3 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{companion}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-green-400">{stats.likes} likes</span>
                          <span className="text-xs text-red-400">{stats.dislikes} dislikes</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/60">Total</p>
                        <p className="text-lg font-bold text-cyan-400">{stats.likes + stats.dislikes}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
