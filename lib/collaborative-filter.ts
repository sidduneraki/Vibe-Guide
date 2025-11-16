import "server-only"
import { MatrixFactorization } from "./advanced-content-analysis"

interface UserRating {
  userId: string
  movieId: string
  rating: number
  timestamp: number
}

interface UserProfile {
  userId: string
  ratings: Map<string, number>
  ratingVector: number[]
}

// Collaborative Filtering using user-to-user similarity
export class CollaborativeFilter {
  private userProfiles: Map<string, UserProfile> = new Map()
  private movieIds: Set<string> = new Set()
  private matrixFactorization: MatrixFactorization = new MatrixFactorization(20)
  private useMF = true // Use matrix factorization by default

  addRatings(ratings: UserRating[]) {
    ratings.forEach(({ userId, movieId, rating }) => {
      this.movieIds.add(movieId)

      if (!this.userProfiles.has(userId)) {
        this.userProfiles.set(userId, { userId, ratings: new Map(), ratingVector: [] })
      }

      const profile = this.userProfiles.get(userId)!
      profile.ratings.set(movieId, rating)
    })

    // Build rating vectors for cosine similarity
    this.buildVectors()

    if (ratings.length > 10) {
      this.matrixFactorization.train(ratings, 50)
      this.useMF = true
    }
  }

  private buildVectors() {
    const movieArray = Array.from(this.movieIds)

    for (const profile of this.userProfiles.values()) {
      profile.ratingVector = movieArray.map((movieId) => profile.ratings.get(movieId) || 0)
    }
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0
    let mag1 = 0
    let mag2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      mag1 += vec1[i] * vec1[i]
      mag2 += vec2[i] * vec2[i]
    }

    mag1 = Math.sqrt(mag1)
    mag2 = Math.sqrt(mag2)

    if (mag1 === 0 || mag2 === 0) return 0
    return dotProduct / (mag1 * mag2)
  }

  getRecommendations(userId: string, topK = 5): Map<string, number> {
    const userProfile = this.userProfiles.get(userId)
    if (!userProfile) return new Map()

    if (this.useMF) {
      const allMovies = Array.from(this.movieIds)
      const userRated = new Set(userProfile.ratings.keys())
      const unratedMovies = allMovies.filter((id) => !userRated.has(id))

      const mfRecs = this.matrixFactorization.getRecommendations(userId, unratedMovies, topK)

      return new Map(mfRecs.map(({ itemId, score }) => [itemId, score]))
    }

    const similarUsers: Array<[string, number]> = []

    for (const [otherId, otherProfile] of this.userProfiles.entries()) {
      if (otherId === userId) continue

      const similarity = this.cosineSimilarity(userProfile.ratingVector, otherProfile.ratingVector)
      if (similarity > 0) similarUsers.push([otherId, similarity])
    }

    similarUsers.sort((a, b) => b[1] - a[1])

    const recommendations: Map<string, number> = new Map()
    const userRatedMovies = new Set(userProfile.ratings.keys())

    for (const [similarUserId, similarity] of similarUsers.slice(0, 10)) {
      const similarProfile = this.userProfiles.get(similarUserId)!

      for (const [movieId, rating] of similarProfile.ratings.entries()) {
        if (userRatedMovies.has(movieId)) continue

        const weightedRating = rating * similarity
        recommendations.set(movieId, (recommendations.get(movieId) || 0) + weightedRating)
      }
    }

    return new Map(
      Array.from(recommendations.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topK),
    )
  }
}
