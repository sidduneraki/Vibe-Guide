import "server-only"
import { ContentBasedFilter } from "./content-based-filter"
import { CollaborativeFilter } from "./collaborative-filter"

interface Movie {
  id: string
  title: string
  genres: string[]
  cast: string[]
  director?: string
  overview: string
  rating: number
  poster_path?: string
}

interface UserRating {
  userId: string
  movieId: string
  rating: number
  timestamp: number
}

export class HybridRecommender {
  private contentFilter: ContentBasedFilter
  private collaborativeFilter: CollaborativeFilter
  private movies: Map<string, Movie> = new Map()
  private contentWeight = 0.7
  private collaborativeWeight = 0.3

  constructor() {
    this.contentFilter = new ContentBasedFilter()
    this.collaborativeFilter = new CollaborativeFilter()
  }

  loadMovies(movies: Movie[]) {
    movies.forEach((movie) => this.movies.set(movie.id, movie))
    this.contentFilter.addMovies(movies)
  }

  loadUserRatings(ratings: UserRating[]) {
    this.collaborativeFilter.addRatings(ratings)
  }

  getRecommendations(userId: string, userHistory: string[], topK = 5): Movie[] {
    const contentRecs = this.contentFilter.getRecommendations(userId, userHistory, topK * 2)
    const collaborativeRecs = this.collaborativeFilter.getRecommendations(userId, topK * 2)

    const hybridScores: Map<string, number> = new Map()

    // Score from content-based filtering
    contentRecs.forEach((movieId, index) => {
      const score = (1 - index / (topK * 2)) * this.contentWeight
      hybridScores.set(movieId, (hybridScores.get(movieId) || 0) + score)
    })

    // Score from collaborative filtering
    for (const [movieId, score] of collaborativeRecs.entries()) {
      const normalizedScore = (score / 5) * this.collaborativeWeight
      hybridScores.set(movieId, (hybridScores.get(movieId) || 0) + normalizedScore)
    }

    // Filter out already-rated movies and sort by score
    return Array.from(hybridScores.entries())
      .filter(([id]) => !userHistory.includes(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([id]) => this.movies.get(id)!)
      .filter(Boolean)
  }
}

// Singleton instance
let recommender: HybridRecommender | null = null

export function getHybridRecommender(): HybridRecommender {
  if (!recommender) {
    recommender = new HybridRecommender()
  }
  return recommender
}
