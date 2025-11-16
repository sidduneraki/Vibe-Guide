import "server-only"
import { AdvancedContentAnalyzer } from "./advanced-content-analysis"

interface Movie {
  id: string
  title: string
  genres: string[]
  cast: string[]
  director?: string
  overview: string
  rating: number
}

interface ContentVector {
  movieId: string
  vector: number[]
}

export class ContentBasedFilter {
  private movies: Map<string, Movie> = new Map()
  private vectors: Map<string, number[]> = new Map()
  private vocabulary: Set<string> = new Set()
  private analyzer: AdvancedContentAnalyzer = new AdvancedContentAnalyzer()
  private tfidfVectors: Map<string, Map<string, number>> = new Map()

  addMovies(movies: Movie[]) {
    const documents = movies.map((movie) => ({
      id: movie.id,
      text: `${movie.genres.join(" ")} ${movie.overview} ${movie.cast.join(" ")} ${movie.director || ""}`,
    }))

    this.analyzer.buildCorpus(documents)

    movies.forEach((movie) => {
      this.movies.set(movie.id, movie)
      this.buildVector(movie)
      const text = `${movie.genres.join(" ")} ${movie.overview} ${movie.cast.join(" ")} ${movie.director || ""}`
      this.tfidfVectors.set(movie.id, this.analyzer.getTFIDFVector(text))
    })
  }

  private buildVector(movie: Movie) {
    const terms = [
      ...movie.genres.map((g) => `genre:${g.toLowerCase()}`),
      ...movie.cast.map((c) => `cast:${c.toLowerCase()}`),
      ...(movie.director ? [`director:${movie.director.toLowerCase()}`] : []),
      ...movie.overview
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 20),
    ]

    terms.forEach((term) => this.vocabulary.add(term))
  }

  getSimilarity(movieId1: string, movieId2: string): number {
    const movie1 = this.movies.get(movieId1)
    const movie2 = this.movies.get(movieId2)

    if (!movie1 || !movie2) return 0

    // Basic similarity (genre, cast, director)
    const commonGenres = movie1.genres.filter((g) => movie2.genres.includes(g)).length
    const genreSim = commonGenres / Math.max(movie1.genres.length, movie2.genres.length, 1)

    const commonCast = movie1.cast.filter((c) => movie2.cast.includes(c)).length
    const castSim = commonCast / Math.max(movie1.cast.length, movie2.cast.length, 1)

    const directorSim = movie1.director === movie2.director ? 1 : 0

    const basicSim = genreSim * 0.5 + castSim * 0.3 + directorSim * 0.2

    const vec1 = this.tfidfVectors.get(movieId1)
    const vec2 = this.tfidfVectors.get(movieId2)

    let tfidfSim = 0
    if (vec1 && vec2) {
      tfidfSim = this.analyzer.cosineSimilarity(vec1, vec2)
    }

    return basicSim * 0.7 + tfidfSim * 0.3
  }

  getRecommendations(userId: string, ratedMovies: string[], topK = 5): string[] {
    if (ratedMovies.length === 0) return []

    const scores: Map<string, number> = new Map()

    for (const candidateId of this.movies.keys()) {
      if (ratedMovies.includes(candidateId)) continue

      let totalSim = 0
      for (const ratedId of ratedMovies) {
        totalSim += this.getSimilarity(ratedId, candidateId)
      }

      scores.set(candidateId, totalSim / ratedMovies.length)
    }

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([id]) => id)
  }
}
