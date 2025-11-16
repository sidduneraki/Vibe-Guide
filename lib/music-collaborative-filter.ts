"server-only"

import { musicDatabase, userMusicRatings, type Song, type UserMusicRating } from "./music-dataset"

export class MusicCollaborativeFilter {
  private songs: Song[]
  private ratings: UserMusicRating[]

  constructor() {
    this.songs = musicDatabase
    this.ratings = userMusicRatings
  }

  // Calculate cosine similarity between two users based on their ratings
  private calculateUserSimilarity(userId1: number, userId2: number): number {
    const user1Ratings = this.ratings.filter((r) => r.userId === userId1)
    const user2Ratings = this.ratings.filter((r) => r.userId === userId2)

    // Find common songs rated by both users
    const commonSongs = new Set(
      user1Ratings.map((r) => r.songId).filter((songId) => user2Ratings.some((r2) => r2.songId === songId)),
    )

    if (commonSongs.size === 0) return 0

    // Calculate cosine similarity
    let dotProduct = 0
    let magnitude1 = 0
    let magnitude2 = 0

    for (const songId of commonSongs) {
      const rating1 = user1Ratings.find((r) => r.songId === songId)?.rating || 0
      const rating2 = user2Ratings.find((r) => r.songId === songId)?.rating || 0

      dotProduct += rating1 * rating2
      magnitude1 += rating1 * rating1
      magnitude2 += rating2 * rating2
    }

    const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2)
    return denominator > 0 ? dotProduct / denominator : 0
  }

  // Predict rating for a user-song pair based on similar users
  private predictRating(userId: number, songId: number): number {
    // Find all users who rated this song
    const usersWhoRated = this.ratings.filter((r) => r.songId === songId && r.userId !== userId).map((r) => r.userId)

    if (usersWhoRated.length === 0) {
      // No ratings available, return average song rating
      const song = this.songs.find((s) => s.id === songId)
      return song ? song.rating / 5.0 : 0.5
    }

    // Calculate weighted average based on user similarity
    let weightedSum = 0
    let similaritySum = 0

    for (const otherUserId of usersWhoRated) {
      const similarity = this.calculateUserSimilarity(userId, otherUserId)
      const rating = this.ratings.find((r) => r.userId === otherUserId && r.songId === songId)?.rating || 0

      weightedSum += similarity * rating
      similaritySum += similarity
    }

    if (similaritySum === 0) {
      const song = this.songs.find((s) => s.id === songId)
      return song ? song.rating / 5.0 : 0.5
    }

    // Normalize to 0-1 scale (ratings are 1-5)
    return weightedSum / similaritySum / 5.0
  }

  // Get collaborative filtering recommendations for a user
  getRecommendations(userId: number, mood: string, limit = 10): Array<{ song: Song; score: number }> {
    // Filter songs the user hasn't rated yet
    const ratedSongIds = new Set(this.ratings.filter((r) => r.userId === userId).map((r) => r.songId))

    const unratedSongs = this.songs.filter((s) => !ratedSongIds.has(s.id))

    // Predict ratings for unrated songs
    const predictions = unratedSongs.map((song) => ({
      song,
      score: this.predictRating(userId, song.id),
    }))

    return predictions.sort((a, b) => b.score - a.score).slice(0, limit)
  }
}
