import { type PodcastRating, podcastRatings, podcastDataset } from "./podcast-dataset"

export class PodcastCollaborativeFilter {
  private ratings: PodcastRating[]
  private userSimilarityCache: Map<string, number> = new Map()

  constructor(ratings: PodcastRating[] = podcastRatings) {
    this.ratings = ratings
  }

  // Calculate cosine similarity between two users
  private calculateUserSimilarity(user1: number, user2: number): number {
    const cacheKey = `${Math.min(user1, user2)}_${Math.max(user1, user2)}`
    if (this.userSimilarityCache.has(cacheKey)) {
      return this.userSimilarityCache.get(cacheKey)!
    }

    const user1Ratings = this.ratings.filter((r) => r.userId === user1)
    const user2Ratings = this.ratings.filter((r) => r.userId === user2)

    // Find common podcasts
    const commonPodcasts = user1Ratings.filter((r1) => user2Ratings.some((r2) => r2.podcastId === r1.podcastId))

    if (commonPodcasts.length === 0) return 0

    // Calculate cosine similarity
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    commonPodcasts.forEach((r1) => {
      const r2 = user2Ratings.find((r) => r.podcastId === r1.podcastId)!
      dotProduct += r1.rating * r2.rating
      norm1 += r1.rating * r1.rating
      norm2 += r2.rating * r2.rating
    })

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
    this.userSimilarityCache.set(cacheKey, similarity)
    return similarity
  }

  // Predict rating for a user-podcast pair
  predictRating(userId: number, podcastId: number): number {
    // Check if user has already rated this podcast
    const existingRating = this.ratings.find((r) => r.userId === userId && r.podcastId === podcastId)
    if (existingRating) return existingRating.rating

    // Find similar users who have rated this podcast
    const allUsers = [...new Set(this.ratings.map((r) => r.userId))]
    const similarUsers = allUsers
      .filter((u) => u !== userId)
      .map((u) => ({
        userId: u,
        similarity: this.calculateUserSimilarity(userId, u),
        rating: this.ratings.find((r) => r.userId === u && r.podcastId === podcastId)?.rating,
      }))
      .filter((u) => u.rating !== undefined && u.similarity > 0)

    if (similarUsers.length === 0) {
      // Return average rating if no similar users
      const podcast = podcastDataset.find((p) => p.id === podcastId)
      return podcast?.rating || 4.0
    }

    // Weighted average of ratings from similar users
    const totalWeight = similarUsers.reduce((sum, u) => sum + u.similarity, 0)
    const weightedSum = similarUsers.reduce((sum, u) => sum + u.similarity * u.rating!, 0)

    return weightedSum / totalWeight
  }

  // Get top N recommendations for a user
  getRecommendations(userId: number, topN = 10): Array<{ podcastId: number; predictedRating: number }> {
    // Get podcasts user hasn't rated
    const ratedPodcastIds = this.ratings.filter((r) => r.userId === userId).map((r) => r.podcastId)
    const unratedPodcasts = podcastDataset.filter((p) => !ratedPodcastIds.includes(p.id))

    // Predict ratings for unrated podcasts
    const predictions = unratedPodcasts.map((podcast) => ({
      podcastId: podcast.id,
      predictedRating: this.predictRating(userId, podcast.id),
    }))

    // Sort by predicted rating
    predictions.sort((a, b) => b.predictedRating - a.predictedRating)
    return predictions.slice(0, topN)
  }
}
