"server-only"

import { MusicContentBasedFilter } from "./music-content-filter"
import { MusicCollaborativeFilter } from "./music-collaborative-filter"
import type { Song } from "./music-dataset"

interface HybridMusicRecommendation {
  song: Song
  contentScore: number
  collaborativeScore: number
  hybridScore: number
}

export class MusicHybridRecommender {
  private contentFilter: MusicContentBasedFilter
  private collaborativeFilter: MusicCollaborativeFilter
  private contentWeight: number
  private collaborativeWeight: number

  constructor(contentWeight = 0.7, collaborativeWeight = 0.3) {
    this.contentFilter = new MusicContentBasedFilter()
    this.collaborativeFilter = new MusicCollaborativeFilter()
    this.contentWeight = contentWeight
    this.collaborativeWeight = collaborativeWeight
  }

  // Get hybrid recommendations combining both approaches
  getHybridRecommendations(userId: number, mood: string, limit = 10): HybridMusicRecommendation[] {
    // Get recommendations from both filters
    const contentRecs = this.contentFilter.getRecommendations(mood, limit * 2)
    const collaborativeRecs = this.collaborativeFilter.getRecommendations(userId, mood, limit * 2)

    // Create a map to combine scores
    const scoreMap = new Map<number, { song: Song; contentScore: number; collaborativeScore: number }>()

    // Add content-based scores
    for (const rec of contentRecs) {
      scoreMap.set(rec.song.id, {
        song: rec.song,
        contentScore: rec.score,
        collaborativeScore: 0,
      })
    }

    // Add collaborative scores
    for (const rec of collaborativeRecs) {
      const existing = scoreMap.get(rec.song.id)
      if (existing) {
        existing.collaborativeScore = rec.score
      } else {
        scoreMap.set(rec.song.id, {
          song: rec.song,
          contentScore: 0,
          collaborativeScore: rec.score,
        })
      }
    }

    // Calculate hybrid scores
    const hybridRecs: HybridMusicRecommendation[] = []
    for (const [_, data] of scoreMap) {
      const hybridScore = data.contentScore * this.contentWeight + data.collaborativeScore * this.collaborativeWeight

      hybridRecs.push({
        song: data.song,
        contentScore: data.contentScore,
        collaborativeScore: data.collaborativeScore,
        hybridScore,
      })
    }

    // Sort by hybrid score and return top results
    return hybridRecs.sort((a, b) => b.hybridScore - a.hybridScore).slice(0, limit)
  }
}
