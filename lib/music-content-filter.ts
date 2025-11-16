"server-only"

import { musicDatabase, type Song } from "./music-dataset"

export class MusicContentBasedFilter {
  private songs: Song[]
  private similarityMatrix: Map<number, Map<number, number>>

  constructor() {
    this.songs = musicDatabase
    this.similarityMatrix = new Map()
    this.computeSimilarityMatrix()
  }

  // Compute TF-IDF style similarity between songs based on genres, mood, and energy
  private computeSimilarityMatrix(): void {
    for (const song1 of this.songs) {
      const song1Similarities = new Map<number, number>()

      for (const song2 of this.songs) {
        if (song1.id === song2.id) {
          song1Similarities.set(song2.id, 1.0)
          continue
        }

        const similarity = this.calculateSimilarity(song1, song2)
        song1Similarities.set(song2.id, similarity)
      }

      this.similarityMatrix.set(song1.id, song1Similarities)
    }
  }

  // Calculate similarity score between two songs
  private calculateSimilarity(song1: Song, song2: Song): number {
    // Genre similarity (Jaccard coefficient)
    const genres1 = new Set(song1.genres)
    const genres2 = new Set(song2.genres)
    const genreIntersection = [...genres1].filter((g) => genres2.has(g)).length
    const genreUnion = new Set([...genres1, ...genres2]).size
    const genreSimilarity = genreUnion > 0 ? genreIntersection / genreUnion : 0

    // Mood similarity (exact match or similar moods)
    const moodMap: Record<string, string[]> = {
      happy: ["happy", "energetic"],
      sad: ["sad", "thoughtful"],
      energetic: ["energetic", "happy"],
      relaxed: ["relaxed", "romantic"],
      romantic: ["romantic", "relaxed"],
      thoughtful: ["thoughtful", "sad"],
    }
    const mood1Related = moodMap[song1.mood] || [song1.mood]
    const moodSimilarity = mood1Related.includes(song2.mood) ? 1.0 : 0.0

    // Energy similarity (normalized difference)
    const energyDiff = Math.abs(song1.energy - song2.energy)
    const energySimilarity = 1 - energyDiff / 100

    // Artist similarity (same artist bonus)
    const artistSimilarity = song1.artist === song2.artist ? 1.0 : 0.0

    // Weighted combination
    return genreSimilarity * 0.35 + moodSimilarity * 0.3 + energySimilarity * 0.2 + artistSimilarity * 0.15
  }

  // Get content-based recommendations for a mood
  getRecommendations(mood: string, limit = 10): Array<{ song: Song; score: number }> {
    // Filter songs by mood
    const moodMap: Record<string, string[]> = {
      happy: ["happy", "energetic"],
      sad: ["sad", "thoughtful"],
      energetic: ["energetic", "happy"],
      relaxed: ["relaxed", "romantic"],
      romantic: ["romantic", "relaxed"],
      thoughtful: ["thoughtful", "sad"],
      focused: ["relaxed", "thoughtful"],
    }

    const relevantMoods = moodMap[mood] || [mood]
    const candidates = this.songs.filter((s) => relevantMoods.includes(s.mood))

    // Sort by rating and return top results
    const scored = candidates.map((song) => ({
      song,
      score: song.rating / 5.0, // Normalize rating to 0-1 scale
    }))

    return scored.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  // Get similar songs to a given song
  getSimilarSongs(songId: number, limit = 10): Array<{ song: Song; score: number }> {
    const similarities = this.similarityMatrix.get(songId)
    if (!similarities) return []

    const results: Array<{ song: Song; score: number }> = []

    for (const [otherSongId, score] of similarities.entries()) {
      if (otherSongId === songId) continue

      const song = this.songs.find((s) => s.id === otherSongId)
      if (song) {
        results.push({ song, score })
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  }
}
