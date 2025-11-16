import { type NextRequest, NextResponse } from "next/server"

interface MoodProfile {
  primary: string
  secondary?: string
  energy: number // 0-100 (low to high)
  intensity: number // 0-100
  confidence: number // 0-100
  keywords: string[]
  emoji?: string
}

// Extended mood detection with nuanced analysis
export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    const moodProfile = analyzeMood(input)
    return NextResponse.json({ moodProfile })
  } catch (error) {
    console.error("Mood detection error:", error)
    return NextResponse.json({ error: "Failed to analyze mood" }, { status: 500 })
  }
}

function analyzeMood(input: string): MoodProfile {
  const emojiMoodMap: Record<string, { mood: string; energy: number; intensity: number }> = {
    // Happy/Positive
    "😊": { mood: "happy", energy: 60, intensity: 40 },
    "😄": { mood: "happy", energy: 70, intensity: 50 },
    "🥳": { mood: "celebratory", energy: 90, intensity: 80 },
    "🤩": { mood: "excited", energy: 85, intensity: 75 },
    "😍": { mood: "romantic", energy: 50, intensity: 60 },
    "🤗": { mood: "loving", energy: 60, intensity: 65 },

    // Sad/Negative
    "😢": { mood: "sad", energy: 20, intensity: 70 },
    "😭": { mood: "devastated", energy: 10, intensity: 90 },
    "😞": { mood: "sad", energy: 25, intensity: 65 },
    "😔": { mood: "melancholic", energy: 30, intensity: 55 },

    // Energetic
    "💪": { mood: "motivated", energy: 85, intensity: 70 },
    "🔥": { mood: "fired-up", energy: 95, intensity: 85 },
    "⚡": { mood: "energetic", energy: 90, intensity: 80 },
    "🎉": { mood: "celebratory", energy: 88, intensity: 82 },

    // Calm/Relaxed
    "😴": { mood: "tired", energy: 15, intensity: 30 },
    "😌": { mood: "peaceful", energy: 40, intensity: 35 },
    "🧘": { mood: "meditative", energy: 35, intensity: 40 },
    "🌙": { mood: "sleepy", energy: 20, intensity: 25 },

    // Thoughtful
    "🤔": { mood: "thoughtful", energy: 45, intensity: 50 },
    "😎": { mood: "confident", energy: 70, intensity: 60 },

    // Angry
    "😡": { mood: "angry", energy: 75, intensity: 80 },
    "🤬": { mood: "furious", energy: 85, intensity: 90 },
  }

  const textMoodPatterns: Record<string, { mood: string; keywords: string[]; energy: number; intensity: number }> = {
    happy: {
      mood: "happy",
      keywords: ["happy", "joy", "wonderful", "amazing", "great", "love", "fantastic", "excellent", "blessed"],
      energy: 70,
      intensity: 60,
    },
    excited: {
      mood: "excited",
      keywords: ["excited", "pumped", "stoked", "hyped", "thrilled", "electrified"],
      energy: 85,
      intensity: 75,
    },
    sad: {
      mood: "sad",
      keywords: ["sad", "down", "blue", "lonely", "grief", "devastated", "heartbroken"],
      energy: 25,
      intensity: 70,
    },
    relaxed: {
      mood: "relaxed",
      keywords: ["chill", "relax", "calm", "peaceful", "serene", "tranquil", "zen", "mellow"],
      energy: 40,
      intensity: 35,
    },
    energetic: {
      mood: "energetic",
      keywords: ["energy", "pump", "dance", "workout", "run", "move", "active", "intense"],
      energy: 88,
      intensity: 80,
    },
    thoughtful: {
      mood: "thoughtful",
      keywords: ["think", "ponder", "wonder", "question", "analyze", "reflect", "contemplate"],
      energy: 45,
      intensity: 50,
    },
    angry: {
      mood: "angry",
      keywords: ["angry", "mad", "furious", "rage", "upset", "frustrated", "agitated"],
      energy: 80,
      intensity: 85,
    },
    romantic: {
      mood: "romantic",
      keywords: ["love", "romance", "date", "kiss", "affection", "passion", "connection"],
      energy: 55,
      intensity: 65,
    },
    focused: {
      mood: "focused",
      keywords: ["study", "work", "concentrate", "focus", "productive", "deadline", "task"],
      energy: 60,
      intensity: 70,
    },
  }

  let detectedMood = "neutral"
  let energy = 50
  let intensity = 50
  let confidence = 0
  let keywords: string[] = []
  let emoji = ""

  // Check for emojis first (higher priority)
  for (const [em, moodData] of Object.entries(emojiMoodMap)) {
    if (input.includes(em)) {
      detectedMood = moodData.mood
      energy = moodData.energy
      intensity = moodData.intensity
      emoji = em
      confidence = 90
      break
    }
  }

  // If no emoji, analyze text
  if (confidence < 90) {
    const inputLower = input.toLowerCase()

    for (const [_, pattern] of Object.entries(textMoodPatterns)) {
      let matchScore = 0
      const matchedKeywords: string[] = []

      pattern.keywords.forEach((keyword) => {
        if (inputLower.includes(keyword)) {
          matchScore += 1
          matchedKeywords.push(keyword)
        }
      })

      if (matchScore > 0 && matchScore > confidence / 30) {
        detectedMood = pattern.mood
        energy = pattern.energy
        intensity = pattern.intensity
        confidence = Math.min((matchScore / pattern.keywords.length) * 100, 95)
        keywords = matchedKeywords
      }
    }
  }

  return {
    primary: detectedMood,
    energy,
    intensity,
    confidence: Math.round(confidence),
    keywords,
    emoji,
  }
}
