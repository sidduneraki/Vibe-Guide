export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
}

export interface UserProfile {
  preferredGenres: Record<string, number> // genre: score
  preferredArtists: string[]
  preferredHosts: string[]
  moodPatterns: Record<string, number>
  engagementHistory: Array<{
    itemId: string
    type: "like" | "dislike" | "comment"
    timestamp: Date
  }>
}

export class ChatContextManager {
  private messageHistory: ChatMessage[] = []
  private userProfile: UserProfile = {
    preferredGenres: {},
    preferredArtists: [],
    preferredHosts: [],
    moodPatterns: {},
    engagementHistory: [],
  }

  addMessage(message: ChatMessage): void {
    this.messageHistory.push(message)
  }

  getContext(limit = 10): ChatMessage[] {
    return this.messageHistory.slice(-limit)
  }

  updateUserProfile(feedback: any): void {
    // Track engagement patterns
    if (feedback.type === "like") {
      this.userProfile.engagementHistory.push({
        itemId: feedback.itemId,
        type: "like",
        timestamp: new Date(),
      })
    }

    // Update mood patterns
    if (feedback.moodContext?.primary) {
      const mood = feedback.moodContext.primary
      this.userProfile.moodPatterns[mood] = (this.userProfile.moodPatterns[mood] || 0) + 1
    }
  }

  getUserProfile(): UserProfile {
    return this.userProfile
  }

  clearHistory(): void {
    this.messageHistory = []
  }

  summarizeConversation(): string {
    const recentMessages = this.messageHistory.slice(-5)
    const userMessages = recentMessages.filter((m) => m.role === "user").map((m) => m.content)
    return userMessages.join(" | ")
  }
}

// Conversation context singleton
let contextManager: ChatContextManager | null = null

export function getChatContextManager(): ChatContextManager {
  if (!contextManager) {
    contextManager = new ChatContextManager()
  }
  return contextManager
}
