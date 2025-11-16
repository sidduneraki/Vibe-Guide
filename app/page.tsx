"use client"

import { useState } from "react"
import Header from "@/components/header"
import MoodInput from "@/components/mood-input"
import RecommendationsDisplay from "@/components/recommendations-display"
import ChatBot from "@/components/chatbot"
import SurpriseButton from "@/components/surprise-button"
import LearningDashboard from "@/components/learning-dashboard"
import HistorySidebar from "@/components/history-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Sparkles, Compass } from "lucide-react"

export default function Home() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [moodData, setMoodData] = useState(null)
  const [feedback, setFeedback] = useState({})
  const [activeTab, setActiveTab] = useState("discover")
  const [showLearningDashboard, setShowLearningDashboard] = useState(false)
  const [personalizedMode, setPersonalizedMode] = useState(false)
  const [companion, setCompanion] = useState<string | undefined>(undefined)
  const [activeContentType, setActiveContentType] = useState<"all" | "movie" | "song" | "podcast">("all")

  const handleMoodSubmit = async (input: string, companionValue?: string) => {
    setLoading(true)
    setCompanion(companionValue)
    try {
      const endpoint = personalizedMode ? "/api/recommend-personalized" : "/api/recommend"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          userId: "anonymous_user",
          userFeedbackHistory: Object.entries(feedback).map(([itemId, data]: any) => ({
            itemId,
            type: data.type,
            itemTitle: data.title || "Unknown",
            contentType: data.contentType || "movie",
            moodContext: moodData,
          })),
          companion: companionValue,
        }),
      })
      const data = await response.json()
      setRecommendations(data.recommendations || [])
      setMoodData(data.moodData || {})
      setFeedback({})
      setShowLearningDashboard(true)
    } catch (error) {
      console.error("Error fetching recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (itemId: string, type: "like" | "dislike" | "comment", value?: string) => {
    const item = recommendations.find((r: any) => r.id === itemId)
    setFeedback((prev) => ({
      ...prev,
      [itemId]: {
        type,
        value,
        title: item?.title || "Unknown",
        contentType: item?.type || "movie",
        timestamp: new Date(),
      },
    }))

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          itemTitle: item?.title || "Unknown",
          contentType: item?.type || "movie",
          type,
          comment: value,
          moodContext: moodData,
          userId: "anonymous_user",
          companion,
        }),
      })

      if (type !== "comment") {
        await fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "content_engaged",
            data: {
              contentId: itemId,
              feedback: type,
              timestamp: new Date().toISOString(),
            },
          }),
        })
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    }
  }

  const handleSurpriseMe = async () => {
    setLoading(true)
    try {
      console.log("[v0] Surprise Me clicked")
      const response = await fetch("/api/surprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userHistory: feedback }),
      })
      const data = await response.json()
      console.log("[v0] Surprise Me response:", data)
      console.log("[v0] Recommendations count:", data.recommendations?.length)
      console.log("[v0] Movies in response:", data.recommendations?.filter((r: any) => r.type === "movie").length)
      console.log("[v0] Songs in response:", data.recommendations?.filter((r: any) => r.type === "song").length)
      console.log("[v0] Podcasts in response:", data.recommendations?.filter((r: any) => r.type === "podcast").length)

      setRecommendations(data.recommendations || [])
      setMoodData(data.moodData || {})
      setFeedback({})
      setShowLearningDashboard(true)
    } catch (error) {
      console.error("Error getting surprise recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
      {/* Main Content */}
      <div className="flex flex-col">
        <Header activeContentType={activeContentType} onContentTypeChange={setActiveContentType} />

        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {showLearningDashboard && <LearningDashboard />}

          <div className="flex justify-center mb-6">
            <div className="flex gap-2 p-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <Button
                onClick={() => setPersonalizedMode(false)}
                variant={!personalizedMode ? "default" : "ghost"}
                className={`gap-2 ${!personalizedMode ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "text-white/70"}`}
              >
                <Compass className="w-4 h-4" />
                Standard
              </Button>
              <Button
                onClick={() => setPersonalizedMode(true)}
                variant={personalizedMode ? "default" : "ghost"}
                className={`gap-2 ${personalizedMode ? "bg-gradient-to-r from-purple-400 to-pink-500" : "text-white/70"}`}
              >
                <Sparkles className="w-4 h-4" />
                Personalized
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/10 backdrop-blur-sm border border-white/20">
              <TabsTrigger
                value="discover"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400 data-[state=active]:to-blue-500"
              >
                Discover
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400 data-[state=active]:to-blue-500"
              >
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="surprise"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-pink-500"
              >
                Surprise 🎁
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-8">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {personalizedMode ? "Your Personalized Recommendations" : "Tell us your mood"}
                  </h2>
                  <p className="text-cyan-200 text-lg">
                    {personalizedMode
                      ? "Based on your previous interactions and viewing companion"
                      : "Use emojis or describe how you're feeling"}
                  </p>
                </div>
                <MoodInput onSubmit={handleMoodSubmit} loading={loading} showCompanion={personalizedMode} />
              </div>

              {recommendations.length > 0 && (
                <RecommendationsDisplay
                  recommendations={recommendations}
                  loading={loading}
                  onFeedback={handleFeedback}
                  feedback={feedback}
                  contentTypeFilter={activeContentType}
                />
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              <ChatBot onRecommendation={setRecommendations} onMoodData={setMoodData} />
            </TabsContent>

            <TabsContent value="surprise" className="space-y-6">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Feeling Lucky?</h2>
                  <p className="text-purple-200 text-lg">Let our AI surprise you with handpicked recommendations</p>
                </div>
                <SurpriseButton onClick={handleSurpriseMe} loading={loading} />

                {recommendations.length > 0 && (
                  <RecommendationsDisplay
                    recommendations={recommendations}
                    loading={loading}
                    onFeedback={handleFeedback}
                    feedback={feedback}
                    contentTypeFilter={activeContentType}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <HistorySidebar />
    </main>
  )
}
