/**
 * User Learning Engine - Tracks preferences and improves recommendations over time
 * Implements collaborative filtering and personalized scoring
 */

export interface FeedbackRecord {
  itemId: string
  itemTitle: string
  type: "like" | "dislike" | "comment"
  contentType: "movie" | "song" | "podcast"
  moodContext: {
    mood: string
    energy: number
    intensity: number
  }
  rating?: number
  comment?: string
  timestamp: Date
  sessionId: string
}

export interface UserPreferences {
  favoriteGenres: Map<string, number>
  favoriteArtists: Map<string, number>
  favoriteHosts: Map<string, number>
  dislikedGenres: Map<string, number>
  moodPreferences: Map<string, string[]> // mood -> [preferred content types]
  engagementScore: number
  lastUpdated: Date
}

export class UserLearningEngine {
  private feedbackHistory: FeedbackRecord[] = []
  private preferences: UserPreferences = {
    favoriteGenres: new Map(),
    favoriteArtists: new Map(),
    favoriteHosts: new Map(),
    dislikedGenres: new Map(),
    moodPreferences: new Map(),
    engagementScore: 0,
    lastUpdated: new Date(),
  }
  private sessionId: string = this.generateSessionId()

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  recordFeedback(feedback: Omit<FeedbackRecord, "timestamp" | "sessionId">): void {
    const record: FeedbackRecord = {
      ...feedback,
      timestamp: new Date(),
      sessionId: this.sessionId,
    }

    this.feedbackHistory.push(record)
    this.updatePreferences(record)
  }

  private updatePreferences(feedback: FeedbackRecord): void {
    const weight = feedback.type === "like" ? 1 : feedback.type === "dislike" ? -0.5 : 0.3

    // Update engagement score
    this.preferences.engagementScore += weight
    this.preferences.engagementScore = Math.max(0, Math.min(100, this.preferences.engagementScore))

    // Extract and update preferences from details (would come from API metadata)
    const details = this.extractContentDetails(feedback)

    if (details.genre) {
      const currentScore = this.preferences.favoriteGenres.get(details.genre) || 0
      if (weight > 0) {
        this.preferences.favoriteGenres.set(details.genre, currentScore + weight)
      } else {
        this.preferences.dislikedGenres.set(
          details.genre,
          Math.abs(weight) + (this.preferences.dislikedGenres.get(details.genre) || 0),
        )
      }
    }

    if (details.artist && feedback.contentType === "song") {
      const currentScore = this.preferences.favoriteArtists.get(details.artist) || 0
      this.preferences.favoriteArtists.set(details.artist, currentScore + weight)
    }

    if (details.host && feedback.contentType === "podcast") {
      const currentScore = this.preferences.favoriteHosts.get(details.host) || 0
      this.preferences.favoriteHosts.set(details.host, currentScore + weight)
    }

    // Update mood preferences
    const mood = feedback.moodContext.mood
    const contentTypes = this.preferences.moodPreferences.get(mood) || []
    if (!contentTypes.includes(feedback.contentType)) {
      contentTypes.push(feedback.contentType)
      this.preferences.moodPreferences.set(mood, contentTypes)
    }

    this.preferences.lastUpdated = new Date()
  }

  private extractContentDetails(feedback: FeedbackRecord): Record<string, string> {
    // In production, this would parse content metadata
    return {
      genre: "drama", // placeholder
      artist: "unknown",
      host: "unknown",
    }
  }

  getPreferences(): UserPreferences {
    return this.preferences
  }

  // Calculate recommendation score based on learned preferences
  calculateRecommendationScore(item: any, mood: string, contentType: string): number {
    let score = 50 // Base score

    // Mood alignment bonus
    const moodPrefs = this.preferences.moodPreferences.get(mood)
    if (moodPrefs?.includes(contentType)) {
      score += 20
    }

    // Engagement history bonus
    const recentEngagement = this.feedbackHistory.filter(
      (f) => new Date().getTime() - f.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000,
    ).length

    score += Math.min(recentEngagement * 2, 15)

    // Genre preference bonus
    if (item.genre && this.preferences.favoriteGenres.has(item.genre)) {
      const genreScore = this.preferences.favoriteGenres.get(item.genre) || 0
      score += Math.min(genreScore * 5, 20)
    }

    // Penalize disliked genres
    if (item.genre && this.preferences.dislikedGenres.has(item.genre)) {
      const dislikeScore = this.preferences.dislikedGenres.get(item.genre) || 0
      score -= Math.min(dislikeScore * 3, 25)
    }

    return Math.max(0, Math.min(100, score))
  }

  getFeedbackSummary(): {
    totalFeedback: number
    likes: number
    dislikes: number
    topGenres: string[]
    recentActivity: FeedbackRecord[]
  } {
    const likes = this.feedbackHistory.filter((f) => f.type === "like").length
    const dislikes = this.feedbackHistory.filter((f) => f.type === "dislike").length
    const topGenres = Array.from(this.preferences.favoriteGenres.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre)

    return {
      totalFeedback: this.feedbackHistory.length,
      likes,
      dislikes,
      topGenres,
      recentActivity: this.feedbackHistory.slice(-5),
    }
  }

  exportLearningData() {
    return {
      preferences: {
        favoriteGenres: Object.fromEntries(this.preferences.favoriteGenres),
        favoriteArtists: Object.fromEntries(this.preferences.favoriteArtists),
        favoriteHosts: Object.fromEntries(this.preferences.favoriteHosts),
        dislikedGenres: Object.fromEntries(this.preferences.dislikedGenres),
        moodPreferences: Object.fromEntries(this.preferences.moodPreferences),
        engagementScore: this.preferences.engagementScore,
      },
      feedbackCount: this.feedbackHistory.length,
      lastUpdated: this.preferences.lastUpdated,
    }
  }
}

// Singleton instance for the application
let learningEngine: UserLearningEngine | null = null

export function getUserLearningEngine(): UserLearningEngine {
  if (!learningEngine) {
    learningEngine = new UserLearningEngine()
  }
  return learningEngine
}
