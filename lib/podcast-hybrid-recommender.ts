import { PodcastContentFilter } from "./podcast-content-filter"
import { PodcastCollaborativeFilter } from "./podcast-collaborative-filter"
import type { Podcast } from "./podcast-dataset"

export class PodcastHybridRecommender {
  private contentFilter: PodcastContentFilter
  private collaborativeFilter: PodcastCollaborativeFilter
  private contentWeight: number
  private collaborativeWeight: number

  constructor(contentWeight = 0.7, collaborativeWeight = 0.3) {
    this.contentFilter = new PodcastContentFilter()
    this.collaborativeFilter = new PodcastCollaborativeFilter()
    this.contentWeight = contentWeight
    this.collaborativeWeight = collaborativeWeight
  }

  // Get hybrid recommendations combining both approaches
  getHybridRecommendations(
    userId: number,
    mood: string,
    topN = 10,
  ): Array<{ podcast: Podcast; hybridScore: number; contentScore: number; collaborativeScore: number }> {
    // Get content-based recommendations
    const contentRecs = this.contentFilter.getPodcastsByMood(mood, 20)

    // Get collaborative filtering predictions
    const collabPredictions = this.collaborativeFilter.getRecommendations(userId, 50)

    // Combine scores
    const hybridScores = contentRecs.map((podcast) => {
      // Content score (normalized)
      const contentScore = podcast.rating / 5.0

      // Collaborative score (predicted rating, normalized)
      const collabPrediction = collabPredictions.find((p) => p.podcastId === podcast.id)
      const collaborativeScore = collabPrediction ? collabPrediction.predictedRating / 5.0 : 0.6

      // Hybrid score (weighted combination)
      const hybridScore = this.contentWeight * contentScore + this.collaborativeWeight * collaborativeScore

      return {
        podcast,
        hybridScore,
        contentScore,
        collaborativeScore,
      }
    })

    // Sort by hybrid score
    hybridScores.sort((a, b) => b.hybridScore - a.hybridScore)
    return hybridScores.slice(0, topN)
  }
}
