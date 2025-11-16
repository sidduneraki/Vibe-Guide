// This implements sentiment detection using algorithms similar to TextBlob/VADER

export interface SentimentResult {
  score: number // -1 to 1
  label: "positive" | "negative" | "neutral"
  confidence: number // 0-100
  intensity: number // 0-100
  emotion: string
  energy: number // 0-100
  keywords: string[]
}

// Sentiment lexicon with scores
const sentimentLexicon: Record<string, number> = {
  // Positive words
  amazing: 0.9,
  awesome: 0.85,
  beautiful: 0.8,
  brilliant: 0.85,
  excellent: 0.85,
  fantastic: 0.9,
  great: 0.8,
  happy: 0.85,
  incredible: 0.9,
  love: 0.9,
  lovely: 0.8,
  magnificent: 0.85,
  marvelous: 0.85,
  perfect: 0.9,
  superb: 0.85,
  wonderful: 0.85,
  good: 0.6,
  nice: 0.6,
  okay: 0.2,
  decent: 0.5,
  fine: 0.5,

  // Negative words
  awful: -0.9,
  bad: -0.6,
  boring: -0.7,
  disgusting: -0.9,
  dreadful: -0.85,
  hate: -0.9,
  horrible: -0.9,
  mediocre: -0.5,
  poor: -0.7,
  sad: -0.8,
  terrible: -0.9,
  ugly: -0.8,
  useless: -0.85,
  waste: -0.7,
  worst: -0.9,
  disappointing: -0.75,
  annoying: -0.7,
  painful: -0.8,
}

// Emoticon mapping
const emoticonMap: Record<string, number> = {
  "😊": 0.9,
  "🥳": 0.95,
  "😄": 0.85,
  "🤗": 0.8,
  "😍": 0.9,
  "🥰": 0.85,
  "😂": 0.8,
  "🎉": 0.85,
  "✨": 0.8,
  "💪": 0.75,
  "🔥": 0.8,
  "⚡": 0.7,
  "😢": -0.85,
  "😭": -0.9,
  "😞": -0.8,
  "😡": -0.85,
  "😠": -0.8,
  "🤬": -0.9,
  "😴": -0.5,
  "😌": 0.3,
  "🧘": 0.4,
  "🌙": -0.2,
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 0)
}

function calculateSentimentScore(tokens: string[]): number {
  let totalScore = 0
  let validTokens = 0

  tokens.forEach((token) => {
    if (sentimentLexicon[token]) {
      totalScore += sentimentLexicon[token]
      validTokens++
    }
  })

  return validTokens > 0 ? totalScore / validTokens : 0
}

function analyzeIntensity(text: string): number {
  // Intensifiers and caps increase intensity
  const intensityMultipliers = {
    "!!!": 3,
    "!!": 2,
    "...": 1.2,
    really: 1.3,
    very: 1.2,
    so: 1.1,
    extremely: 1.4,
    absolutely: 1.4,
  }

  let intensity = 50
  Object.entries(intensityMultipliers).forEach(([intensifier, multiplier]) => {
    if (text.toLowerCase().includes(intensifier)) {
      intensity = Math.min(100, intensity * multiplier)
    }
  })

  // All caps increases intensity
  if (text.match(/[A-Z]{3,}/)) {
    intensity = Math.min(100, intensity * 1.3)
  }

  return Math.min(100, intensity)
}

function detectEmotion(text: string, sentimentScore: number): string {
  const lowerText = text.toLowerCase()

  // Energy detection
  const energyWords = ["energy", "excited", "pump", "dance", "party", "jump", "run"]
  const isEnergetic = energyWords.some((word) => lowerText.includes(word))

  // Relaxation detection
  const relaxWords = ["chill", "relax", "calm", "peaceful", "sleep", "rest", "zen"]
  const isRelaxed = relaxWords.some((word) => lowerText.includes(word))

  // Romance detection
  const romanticWords = ["love", "romantic", "heart", "sweet", "cute", "couple"]
  const isRomantic = romanticWords.some((word) => lowerText.includes(word))

  // Focus detection
  const focusWords = ["focus", "work", "study", "concentrate", "productive", "task"]
  const isFocused = focusWords.some((word) => lowerText.includes(word))

  // Determine emotion based on sentiment and keywords
  if (sentimentScore > 0.6) {
    if (isEnergetic) return "excited"
    if (isRomantic) return "romantic"
    return "happy"
  }
  if (sentimentScore < -0.4) {
    return "sad"
  }
  if (isEnergetic) return "energetic"
  if (isRelaxed) return "relaxed"
  if (isFocused) return "focused"

  return "neutral"
}

function extractKeywords(tokens: string[], sentimentScore: number): string[] {
  // Filter out stop words and extract sentiment-bearing keywords
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
  ])

  return tokens.filter((token) => !stopWords.has(token) && token.length > 2).slice(0, 5)
}

export function analyzeSentiment(input: string): SentimentResult {
  let textScore = 0
  let emoticonScore = 0
  let emoticonCount = 0

  // Analyze emoticons
  Object.entries(emoticonMap).forEach(([emoji, score]) => {
    if (input.includes(emoji)) {
      emoticonScore += score
      emoticonCount++
    }
  })

  // Analyze text tokens
  const tokens = tokenize(input)
  textScore = calculateSentimentScore(tokens)

  // Combine scores (emoticons weighted slightly higher)
  const combinedScore = emoticonCount > 0 ? textScore * 0.6 + (emoticonScore / emoticonCount) * 0.4 : textScore

  // Calculate confidence
  const baseConfidence = Math.abs(combinedScore) * 100
  const confidence = Math.min(100, baseConfidence + (emoticonCount > 0 ? 20 : 0))

  // Analyze intensity
  const intensity = analyzeIntensity(input)

  // Detect emotion
  const emotion = detectEmotion(input, combinedScore)

  // Calculate energy (higher for positive/energetic, lower for negative/relaxed)
  let energy = 50 + combinedScore * 30
  if (emotion === "energetic" || emotion === "excited") energy = Math.max(70, energy)
  if (emotion === "relaxed" || emotion === "sad") energy = Math.min(40, energy)
  energy = Math.max(0, Math.min(100, energy))

  // Extract keywords
  const keywords = extractKeywords(tokens, combinedScore)

  const label: "positive" | "negative" | "neutral" =
    combinedScore > 0.1 ? "positive" : combinedScore < -0.1 ? "negative" : "neutral"

  return {
    score: combinedScore,
    label,
    confidence: Math.round(confidence),
    intensity: Math.round(intensity),
    emotion,
    energy: Math.round(energy),
    keywords,
  }
}
