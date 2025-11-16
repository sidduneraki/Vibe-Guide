"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
}

export default function ChatBot({
  onRecommendation,
  onMoodData,
}: {
  onRecommendation: (recs: any[]) => void
  onMoodData: (data: any) => void
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey there! 👋 I'm AuraMatch, your AI entertainment guide. Tell me about your mood, what you're in the mood for, or ask me anything about movies, music, or podcasts!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentIntent, setCurrentIntent] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I had trouble processing that. Could you try again?",
        timestamp: new Date(),
        intent: data.intent,
        confidence: data.confidence,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setCurrentIntent(data.intent || null)

      if (data.recommendations && data.recommendations.length > 0) {
        onRecommendation(data.recommendations)
        onMoodData(data.moodData || {})
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const quickSuggestions = [
    "I'm feeling happy 😊",
    "Recommend me a movie",
    "What podcasts are trending?",
    "I need something relaxing",
    "Show me upbeat music",
  ]

  const handleQuickSuggestion = (suggestion: string) => {
    setInput(suggestion)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Chat with AuraMatch</h2>
        <p className="text-cyan-200 text-lg">Have a natural conversation and get personalized recommendations</p>
      </div>

      <Card className="bg-gradient-to-b from-white/10 to-white/5 border border-white/20 overflow-hidden flex flex-col h-96 md:h-[32rem]">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className="max-w-xs lg:max-w-md group">
                <div
                  className={`px-4 py-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-none shadow-lg shadow-cyan-500/30"
                      : "bg-white/10 border border-white/20 text-white/90 rounded-bl-none backdrop-blur"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  {msg.intent && (
                    <span className="text-xs text-white/60 mt-1 block italic">
                      Intent: {msg.intent} • Confidence: {msg.confidence || "N/A"}%
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/40 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/20 text-white px-4 py-3 rounded-lg rounded-bl-none backdrop-blur">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 py-3 border-t border-white/10 space-y-2">
            <p className="text-xs text-white/60 uppercase font-semibold">Quick suggestions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 border border-white/10 hover:border-white/30 text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for recommendations or chat naturally..."
            disabled={loading}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white px-6 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  )
}
