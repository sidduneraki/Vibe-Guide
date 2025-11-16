// Advanced NLP algorithms for natural language understanding
import { analyzeSentiment } from "./sentiment-analysis"

export interface NLPAnalysis {
  intent: string
  confidence: number
  entities: Record<string, string[]>
  sentiment: ReturnType<typeof analyzeSentiment>
  contentType: "movie" | "music" | "podcast" | "mixed" | "none"
  moodKeywords: string[]
}

// TF-IDF style intent recognition
const intentKeywords: Record<string, { keywords: string[]; weight: number }> = {
  recommend_movie: {
    keywords: ["movie", "film", "watch", "cinema", "actor", "director", "genre", "imdb", "watch"],
    weight: 1.0,
  },
  recommend_music: {
    keywords: ["song", "music", "artist", "album", "spotify", "track", "musician", "singer", "band"],
    weight: 1.0,
  },
  recommend_podcast: {
    keywords: ["podcast", "listen", "show", "episode", "host", "series", "audio"],
    weight: 1.0,
  },
  ask_mood: {
    keywords: ["feeling", "mood", "vibe", "state", "how am i", "energy", "emotional"],
    weight: 0.9,
  },
  ask_suggestion: {
    keywords: ["suggest", "recommend", "what should", "help me", "ideas", "find me"],
    weight: 0.95,
  },
  refinement: {
    keywords: ["different", "else", "like", "similar", "better", "instead", "more"],
    weight: 0.85,
  },
  feedback: {
    keywords: ["love", "hate", "like", "dislike", "good", "bad", "amazing", "terrible"],
    weight: 0.9,
  },
}

// Genre mapping from keywords
const genreMapping: Record<string, string[]> = {
  action: ["action", "fight", "battle", "adventure", "explosion", "thrilling"],
  comedy: ["funny", "laugh", "humor", "comical", "hilarious"],
  drama: ["emotional", "serious", "deep", "intense", "tragic"],
  horror: ["scary", "horror", "thriller", "suspense", "creepy"],
  romance: ["love", "romantic", "sweet", "couple", "relationship"],
  scifi: ["future", "space", "alien", "sci-fi", "technology", "dystopia"],
  animation: ["cartoon", "animated", "anime", "family"],
}

function calculateTFIDF(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase()
  let score = 0

  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    const matches = lowerText.match(regex)
    score += matches ? matches.length : 0
  })

  return score
}

export function analyzeNLP(userInput: string): NLPAnalysis {
  // Get sentiment analysis
  const sentiment = analyzeSentiment(userInput)

  // Intent detection using TF-IDF scoring
  let bestIntent = "general_chat"
  let bestScore = 0
  const intentScores: Record<string, number> = {}

  Object.entries(intentKeywords).forEach(([intent, data]) => {
    const score = calculateTFIDF(userInput, data.keywords) * data.weight
    intentScores[intent] = score
    if (score > bestScore) {
      bestScore = score
      bestIntent = intent
    }
  })

  // Determine confidence (0-100)
  const maxPossibleScore = Math.max(...Object.values(intentScores), 1)
  const confidence = Math.min(100, Math.round((bestScore / Math.max(maxPossibleScore, 1)) * 100))

  // Content type detection
  let contentType: "movie" | "music" | "podcast" | "mixed" | "none" = "none"
  const movieScore = calculateTFIDF(userInput, intentKeywords.recommend_movie.keywords)
  const musicScore = calculateTFIDF(userInput, intentKeywords.recommend_music.keywords)
  const podcastScore = calculateTFIDF(userInput, intentKeywords.recommend_podcast.keywords)

  if (movieScore > 0 && musicScore > 0) {
    contentType = "mixed"
  } else if (movieScore > 0) {
    contentType = "movie"
  } else if (musicScore > 0) {
    contentType = "music"
  } else if (podcastScore > 0) {
    contentType = "podcast"
  }

  // Entity extraction for genres
  const entities: Record<string, string[]> = {
    genres: [],
    moods: [],
    keywords: sentiment.keywords,
  }

  Object.entries(genreMapping).forEach(([genre, keywords]) => {
    keywords.forEach((keyword) => {
      if (userInput.toLowerCase().includes(keyword)) {
        entities.genres.push(genre)
      }
    })
  })

  // Extract mood keywords
  const moodKeywords = sentiment.keywords
  entities.moods = [sentiment.emotion]

  return {
    intent: bestIntent,
    confidence: Math.max(confidence, 20),
    entities,
    sentiment,
    contentType,
    moodKeywords,
  }
}

// Generate conversational response based on NLP analysis
export function generateResponse(analysis: NLPAnalysis, userMessage: string): string {
  const { intent, sentiment, contentType, entities } = analysis

  // Response templates with variable interpolation
  const responseMap: Record<string, (analysis: NLPAnalysis) => string> = {
    recommend_movie: (a) =>
      `I love that energy! 🎬 Based on your ${a.sentiment.emotion} mood, let me find ${a.entities.genres.length > 0 ? `some ${a.entities.genres.join("/")} ` : ""}movies that'll resonate with you.`,
    recommend_music: (a) =>
      `Perfect vibe! 🎵 I'm pulling up ${a.entities.genres.length > 0 ? `${a.entities.genres.join("/")} ` : ""}tracks that match your ${a.sentiment.emotion} energy.`,
    recommend_podcast: (a) =>
      `Great choice! 🎙️ Let me find podcasts that align with your current ${a.sentiment.emotion} mood.`,
    ask_mood: (a) =>
      `I'm picking up on that ${a.sentiment.emotion} feeling! Let me suggest content that matches this energy perfectly.`,
    ask_suggestion: (a) =>
      `${a.sentiment.label === "positive" ? "I'm feeling the good vibes!" : "I hear you!"} Let me curate some recommendations based on your ${a.sentiment.emotion} state.`,
    refinement: (a) =>
      `Got it! Let me pivot and find something completely different that still matches your ${a.sentiment.emotion} mood.`,
    feedback: (a) =>
      `Thanks for that feedback! ${a.sentiment.label === "positive" ? "I'm glad you loved it!" : "I'll do better next time!"} Let me find something even better.`,
    general_chat: (a) =>
      `Tell me more about what you're looking for! Are you in the mood for a movie, music, or podcast? I can pick up on your ${a.sentiment.emotion} vibe and suggest something perfect.`,
  }

  const responseGenerator = responseMap[analysis.intent] || responseMap.general_chat
  return responseGenerator(analysis)
}
