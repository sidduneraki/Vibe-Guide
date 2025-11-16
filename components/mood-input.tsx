"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Film } from "lucide-react"

const EMOJI_SUGGESTIONS = ["😊", "😢", "🤩", "😡", "😴", "🤔", "😎", "🥳", "😰", "🤗", "😒", "💪"]

const COMPANION_OPTIONS = [
  { value: "alone", label: "Just me", icon: "🧘" },
  { value: "partner", label: "Partner", icon: "💑" },
  { value: "friends", label: "Friends", icon: "👥" },
  { value: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { value: "kids", label: "Kids", icon: "👶" },
]

export default function MoodInput({
  onSubmit,
  loading,
  showCompanion = false,
}: {
  onSubmit: (input: string, companion?: string) => void
  loading: boolean
  showCompanion?: boolean
}) {
  const [input, setInput] = useState("")
  const [companion, setCompanion] = useState("alone")
  const [movieSearch, setMovieSearch] = useState("")

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      onSubmit(value, showCompanion ? companion : undefined)
      setInput("")
      setMovieSearch("")
    }
  }

  const handleMovieSearch = () => {
    if (movieSearch.trim()) {
      onSubmit(`Find movies like ${movieSearch}`, showCompanion ? companion : undefined)
      setMovieSearch("")
      setInput("")
    }
  }

  return (
    <div className="space-y-6">
      {showCompanion && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Users className="w-4 h-4" />
            Who are you watching with?
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {COMPANION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setCompanion(option.value)}
                className={`p-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  companion === option.value
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg"
                    : "bg-white/10 hover:bg-white/20 text-white/80"
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/80">Quick emoji selection:</label>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {EMOJI_SUGGESTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSubmit(emoji)}
              disabled={loading}
              className="p-3 text-2xl rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 transform hover:scale-110 disabled:opacity-50"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/80">Or describe your mood:</label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit(input)}
            placeholder="e.g., 'Feeling adventurous', 'Need to relax', 'Want to dance'..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            disabled={loading}
          />
          <Button
            onClick={() => handleSubmit(input)}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-8"
          >
            {loading ? "Loading..." : "Discover"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Film className="w-4 h-4" />
          Search for specific movies:
        </label>
        <div className="flex gap-2">
          <Input
            value={movieSearch}
            onChange={(e) => setMovieSearch(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleMovieSearch()}
            placeholder="e.g., 'Inception', 'The Matrix', 'Interstellar'..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            disabled={loading}
          />
          <Button
            onClick={handleMovieSearch}
            disabled={loading}
            className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-8"
          >
            {loading ? "Loading..." : "Search"}
          </Button>
        </div>
      </div>
    </div>
  )
}
