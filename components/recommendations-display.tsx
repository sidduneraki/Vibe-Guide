"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, MessageCircle, ExternalLink, Volume2, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface Recommendation {
  id: string
  title: string
  type: "movie" | "song" | "podcast"
  description: string
  image?: string
  rating?: number
  matchScore?: number
  details?: Record<string, any>
  externalLink?: string
  tmdbLink?: string
  spotifyLink?: string
  previewUrl?: string
  podcastLink?: string
}

interface Props {
  recommendations: Recommendation[]
  loading: boolean
  onFeedback: (id: string, type: "like" | "dislike" | "comment", value?: string) => void
  feedback: Record<string, any>
  contentTypeFilter?: "all" | "movie" | "song" | "podcast"
}

export default function RecommendationsDisplay({
  recommendations,
  loading,
  onFeedback,
  feedback,
  contentTypeFilter = "all",
}: Props) {
  const [commentingId, setCommentingId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioRefs] = useState<Record<string, HTMLAudioElement | null>>({})
  const scrollRefs = {
    movie: useRef<HTMLDivElement>(null),
    song: useRef<HTMLDivElement>(null),
    podcast: useRef<HTMLDivElement>(null),
  }

  const groupedRecommendations = {
    movie: recommendations.filter((rec) => rec.type === "movie"),
    song: recommendations.filter((rec) => rec.type === "song"),
    podcast: recommendations.filter((rec) => rec.type === "podcast"),
  }

  console.log("[v0] RecommendationsDisplay - Total:", recommendations.length)
  console.log("[v0] RecommendationsDisplay - Movies:", groupedRecommendations.movie.length)
  console.log("[v0] RecommendationsDisplay - Songs:", groupedRecommendations.song.length)
  console.log("[v0] RecommendationsDisplay - Podcasts:", groupedRecommendations.podcast.length)
  console.log(
    "[v0] Sample song images:",
    groupedRecommendations.song.slice(0, 3).map((s) => ({ title: s.title, image: s.image })),
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "movie":
        return "🎬"
      case "song":
        return "🎵"
      case "podcast":
        return "🎙️"
      default:
        return "✨"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "movie":
        return "from-amber-500 to-orange-500"
      case "song":
        return "from-pink-500 to-rose-500"
      case "podcast":
        return "from-purple-500 to-indigo-500"
      default:
        return "from-cyan-500 to-blue-500"
    }
  }

  const handlePlayPreview = (rec: Recommendation) => {
    if (rec.type === "song" && rec.previewUrl) {
      if (playingId === rec.id) {
        setPlayingId(null)
      } else {
        setPlayingId(rec.id)
      }
    }
  }

  const getExternalLink = (rec: Recommendation): string | null => {
    switch (rec.type) {
      case "movie":
        return rec.externalLink || rec.tmdbLink || null
      case "song":
        return rec.spotifyLink || null
      case "podcast":
        return rec.podcastLink || null
      default:
        return null
    }
  }

  const scroll = (type: "movie" | "song" | "podcast", direction: "left" | "right") => {
    const container = scrollRefs[type].current
    if (container) {
      const scrollAmount = 400
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const renderSection = (type: "movie" | "song" | "podcast", items: Recommendation[]) => {
    if (items.length === 0) return null

    const sectionTitles = {
      movie: "Movies",
      song: "Songs",
      podcast: "Podcasts",
    }

    const sectionIcons = {
      movie: "🎬",
      song: "🎵",
      podcast: "🎙️",
    }

    const sectionColors = {
      movie: "from-amber-500 to-orange-500",
      song: "from-pink-500 to-rose-500",
      podcast: "from-purple-500 to-indigo-500",
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sectionColors[type]} flex items-center justify-center text-2xl shadow-lg`}
            >
              {sectionIcons[type]}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{sectionTitles[type]}</h3>
              <p className="text-sm text-white/50">{items.length} recommendations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => scroll(type, "left")}
              variant="outline"
              size="icon"
              className="rounded-full border-white/20 text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => scroll(type, "right")}
              variant="outline"
              size="icon"
              className="rounded-full border-white/20 text-white hover:bg-white/10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRefs[type]}
          className="flex gap-6 overflow-x-auto overflow-y-visible pb-4 snap-x snap-mandatory scroll-smooth scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {items.map((rec, idx) => (
            <div
              key={rec.id}
              className="group animate-in fade-in slide-in-from-bottom-4 duration-500 flex-shrink-0 w-[340px] snap-start"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <Card className="overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 h-full flex flex-col">
                {rec.image ? (
                  <div className="relative h-48 bg-black/30 overflow-hidden cursor-pointer group">
                    <Image
                      src={rec.image || "/placeholder.svg"}
                      alt={rec.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        console.log("[v0] Image failed to load:", rec.title, rec.image)
                        e.currentTarget.style.display = "none"
                      }}
                      onLoad={() => {
                        console.log("[v0] Image loaded successfully:", rec.title)
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white">
                      {rec.matchScore && `${rec.matchScore}% Match`}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {rec.type === "song" && rec.previewUrl && (
                        <button
                          onClick={() => handlePlayPreview(rec)}
                          className="p-3 bg-pink-500 hover:bg-pink-600 rounded-full transition-all transform hover:scale-110 shadow-lg"
                          title="Play preview"
                        >
                          <Volume2 className="w-6 h-6 text-white" />
                        </button>
                      )}
                      {getExternalLink(rec) && (
                        <a
                          href={getExternalLink(rec) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-cyan-500 hover:bg-cyan-600 rounded-full transition-all transform hover:scale-110 shadow-lg"
                          title="Open in external app"
                        >
                          <ExternalLink className="w-6 h-6 text-white" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`h-32 bg-gradient-to-br ${getTypeColor(rec.type)} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white">
                      {rec.matchScore && `${rec.matchScore}% Match`}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-4xl">{getTypeIcon(rec.type)}</div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-lg font-bold text-white line-clamp-2">{rec.title}</h4>
                    <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                  </div>

                  <p className="text-sm text-white/60 line-clamp-2 mb-4 flex-1">{rec.description}</p>

                  {rec.rating && (
                    <div className="flex items-center gap-1 mb-4">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-semibold text-white">{rec.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {rec.details && (
                    <div className="text-xs text-white/50 space-y-1 mb-4">
                      {Object.entries(rec.details)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key}>
                            <span className="text-white/60">{key}:</span> {String(value)}
                          </div>
                        ))}
                    </div>
                  )}

                  {rec.type === "song" && rec.previewUrl && playingId === rec.id && (
                    <div className="mb-4 p-2 bg-white/5 rounded border border-white/10">
                      <audio
                        ref={(el) => {
                          if (el) audioRefs[rec.id] = el
                        }}
                        controls
                        autoPlay
                        onEnded={() => setPlayingId(null)}
                        className="w-full h-6 [&]:outline-none"
                        src={rec.previewUrl}
                      />
                    </div>
                  )}

                  {/* Feedback Section */}
                  <div className="space-y-3 mt-auto pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                      {getExternalLink(rec) && rec.type !== "song" && (
                        <a
                          href={getExternalLink(rec) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 bg-cyan-500/80 hover:bg-cyan-600 text-white text-sm font-medium rounded border border-cyan-400/30 transition-all flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </a>
                      )}
                      <Button
                        onClick={() => onFeedback(rec.id, "like")}
                        size="sm"
                        className={`flex-1 gap-1 border text-white transition-all ${
                          feedback[rec.id]?.type === "like"
                            ? "bg-green-500/80 hover:bg-green-600 border-green-400/50"
                            : "border-white/20 hover:bg-white/10 bg-transparent"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Like
                      </Button>
                      <Button
                        onClick={() => onFeedback(rec.id, "dislike")}
                        size="sm"
                        className={`flex-1 gap-1 border text-white transition-all ${
                          feedback[rec.id]?.type === "dislike"
                            ? "bg-red-500/80 hover:bg-red-600 border-red-400/50"
                            : "border-white/20 hover:bg-white/10 bg-transparent"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Dislike
                      </Button>
                      <Button
                        onClick={() => setCommentingId(commentingId === rec.id ? null : rec.id)}
                        size="sm"
                        className={`flex-1 gap-1 border text-white transition-all ${
                          commentingId === rec.id
                            ? "bg-blue-500/80 hover:bg-blue-600 border-blue-400/50"
                            : "border-white/20 hover:bg-white/10 bg-transparent"
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Comment
                      </Button>
                    </div>

                    {commentingId === rec.id && (
                      <input
                        type="text"
                        placeholder="Share your thoughts..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value) {
                            onFeedback(rec.id, "comment", e.currentTarget.value)
                            setComments((prev) => ({ ...prev, [rec.id]: e.currentTarget.value }))
                            setCommentingId(null)
                            e.currentTarget.value = ""
                          }
                        }}
                        className="w-full px-2 py-2 text-sm rounded bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400"
                      />
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <h2 className="text-3xl font-bold text-white text-center bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
        Your Personalized Matches
      </h2>

      {(contentTypeFilter === "all" || contentTypeFilter === "movie") &&
        renderSection("movie", groupedRecommendations.movie)}
      {(contentTypeFilter === "all" || contentTypeFilter === "song") &&
        renderSection("song", groupedRecommendations.song)}
      {(contentTypeFilter === "all" || contentTypeFilter === "podcast") &&
        renderSection("podcast", groupedRecommendations.podcast)}

      {recommendations.length === 0 && !loading && (
        <div className="text-center text-white/50 py-12">No recommendations yet. Try describing your mood!</div>
      )}
    </div>
  )
}
