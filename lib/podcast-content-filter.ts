import { type Podcast, podcastDataset } from "./podcast-dataset"

export class PodcastContentFilter {
  private podcasts: Podcast[]
  private similarityMatrix: number[][] = []

  constructor(podcasts: Podcast[] = podcastDataset) {
    this.podcasts = podcasts
    this.buildSimilarityMatrix()
  }

  // Build TF-IDF style similarity matrix
  private buildSimilarityMatrix() {
    const n = this.podcasts.length
    this.similarityMatrix = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          this.similarityMatrix[i][j] = 1.0
        } else {
          const similarity = this.calculateSimilarity(this.podcasts[i], this.podcasts[j])
          this.similarityMatrix[i][j] = similarity
          this.similarityMatrix[j][i] = similarity
        }
      }
    }
  }

  // Calculate similarity between two podcasts
  private calculateSimilarity(podcast1: Podcast, podcast2: Podcast): number {
    // Category overlap (weighted heavily)
    const categoryOverlap = podcast1.categories.filter((cat) => podcast2.categories.includes(cat)).length
    const categoryScore = categoryOverlap / Math.max(podcast1.categories.length, podcast2.categories.length)

    // Host similarity (same host = higher score)
    const hostScore = podcast1.host === podcast2.host ? 0.3 : 0

    // Rating similarity
    const ratingDiff = Math.abs(podcast1.rating - podcast2.rating)
    const ratingScore = Math.max(0, 1 - ratingDiff / 5) * 0.2

    // Combined weighted score
    return categoryScore * 0.7 + hostScore + ratingScore
  }

  // Get similar podcasts based on content
  getSimilarPodcasts(podcastTitle: string, topN = 10): Podcast[] {
    const podcastIndex = this.podcasts.findIndex((p) => p.title.toLowerCase() === podcastTitle.toLowerCase())

    if (podcastIndex === -1) {
      console.warn(`Podcast "${podcastTitle}" not found`)
      return []
    }

    // Get similarity scores for this podcast
    const similarities = this.similarityMatrix[podcastIndex].map((score, idx) => ({ idx, score }))

    // Sort by similarity (exclude self)
    similarities.sort((a, b) => b.score - a.score)

    // Return top N similar podcasts
    return similarities
      .slice(1, topN + 1)
      .map((sim) => this.podcasts[sim.idx])
      .filter((p) => p !== undefined)
  }

  // Get podcasts by mood/categories
  getPodcastsByMood(mood: string, topN = 10): Podcast[] {
    const moodToCategories: Record<string, string[]> = {
      happy: ["Comedy", "Entertainment", "Society"],
      sad: ["Story", "Personal", "Documentary"],
      energetic: ["Interview", "Business", "News"],
      relaxed: ["Arts", "Design", "Education"],
      focused: ["Science", "Education", "Technology"],
      romantic: ["Story", "Arts", "Personal"],
      thoughtful: ["Psychology", "Science", "Society"],
    }

    const targetCategories = moodToCategories[mood] || moodToCategories.relaxed

    // Score podcasts based on category match
    const scored = this.podcasts.map((podcast) => {
      const matchScore = podcast.categories.filter((cat) => targetCategories.includes(cat)).length
      return { podcast, score: matchScore * podcast.rating }
    })

    // Sort and return top N
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topN).map((s) => s.podcast)
  }
}
