"use client"

import { Button } from "@/components/ui/button"

interface HeaderProps {
  activeContentType?: "all" | "movie" | "song" | "podcast"
  onContentTypeChange?: (type: "all" | "movie" | "song" | "podcast") => void
}

export default function Header({ activeContentType = "all", onContentTypeChange }: HeaderProps) {
  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-xl font-bold">V</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent animate-vibe-spin">
                VIBE GUIDE
              </h1>
              <p className="text-xs text-slate-400 font-medium">AI-Powered Entertainment Recommendations</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button
              onClick={() => onContentTypeChange?.("all")}
              variant="ghost"
              size="sm"
              className={`text-sm font-medium transition-all ${
                activeContentType === "all"
                  ? "text-cyan-400 bg-cyan-400/10"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              All
            </Button>
            <span className="text-slate-600">•</span>
            <Button
              onClick={() => onContentTypeChange?.("movie")}
              variant="ghost"
              size="sm"
              className={`text-sm font-medium transition-all ${
                activeContentType === "movie"
                  ? "text-amber-400 bg-amber-400/10"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              Movies
            </Button>
            <span className="text-slate-600">•</span>
            <Button
              onClick={() => onContentTypeChange?.("song")}
              variant="ghost"
              size="sm"
              className={`text-sm font-medium transition-all ${
                activeContentType === "song"
                  ? "text-pink-400 bg-pink-400/10"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              Music
            </Button>
            <span className="text-slate-600">•</span>
            <Button
              onClick={() => onContentTypeChange?.("podcast")}
              variant="ghost"
              size="sm"
              className={`text-sm font-medium transition-all ${
                activeContentType === "podcast"
                  ? "text-purple-400 bg-purple-400/10"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              Podcasts
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
