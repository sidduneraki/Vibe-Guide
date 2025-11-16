import "server-only"

// Advanced Text Analysis using TF-IDF and word embeddings simulation
export class AdvancedContentAnalyzer {
  private vocabulary: Map<string, number> = new Map() // word -> document frequency
  private idfScores: Map<string, number> = new Map()
  private totalDocuments = 0

  // Stopwords to filter out
  private stopwords = new Set([
    "the",
    "is",
    "at",
    "which",
    "on",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "with",
    "to",
    "for",
    "of",
    "as",
    "by",
  ])

  // Word embedding simulation - semantic similarity between words
  private semanticGroups: Map<string, string[]> = new Map([
    ["action", ["adventure", "thriller", "fighting", "chase", "explosive", "intense"]],
    ["comedy", ["funny", "humor", "laugh", "hilarious", "entertaining", "witty"]],
    ["drama", ["emotional", "serious", "touching", "powerful", "deep", "moving"]],
    ["horror", ["scary", "frightening", "terror", "suspense", "creepy", "dark"]],
    ["romance", ["love", "romantic", "passion", "relationship", "heart", "intimate"]],
  ])

  // Build IDF scores from document corpus
  buildCorpus(documents: Array<{ id: string; text: string }>) {
    this.totalDocuments = documents.length
    const docFrequency: Map<string, number> = new Map()

    documents.forEach((doc) => {
      const words = this.tokenize(doc.text)
      const uniqueWords = new Set(words)

      uniqueWords.forEach((word) => {
        docFrequency.set(word, (docFrequency.get(word) || 0) + 1)
      })
    })

    // Calculate IDF scores
    docFrequency.forEach((freq, word) => {
      const idf = Math.log(this.totalDocuments / freq)
      this.idfScores.set(word, idf)
      this.vocabulary.set(word, freq)
    })
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !this.stopwords.has(word))
      .map((word) => this.stem(word))
  }

  private stem(word: string): string {
    // Remove common suffixes
    if (word.endsWith("ing")) return word.slice(0, -3)
    if (word.endsWith("ed")) return word.slice(0, -2)
    if (word.endsWith("ly")) return word.slice(0, -2)
    if (word.endsWith("tion")) return word.slice(0, -4)
    if (word.endsWith("ness")) return word.slice(0, -4)
    return word
  }

  getTFIDFVector(text: string): Map<string, number> {
    const words = this.tokenize(text)
    const termFreq: Map<string, number> = new Map()

    // Calculate term frequency
    words.forEach((word) => {
      termFreq.set(word, (termFreq.get(word) || 0) + 1)
    })

    // Calculate TF-IDF
    const tfidfVector: Map<string, number> = new Map()
    termFreq.forEach((tf, term) => {
      const idf = this.idfScores.get(term) || 0
      tfidfVector.set(term, (tf / words.length) * idf)
    })

    return tfidfVector
  }

  getSemanticSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1.0

    for (const [key, group] of this.semanticGroups.entries()) {
      if (group.includes(word1) && group.includes(word2)) return 0.7
      if (word1 === key && group.includes(word2)) return 0.8
      if (word2 === key && group.includes(word1)) return 0.8
    }

    return 0
  }

  cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0
    let mag1 = 0
    let mag2 = 0

    // Standard cosine similarity
    const allKeys = new Set([...vec1.keys(), ...vec2.keys()])

    allKeys.forEach((key) => {
      const val1 = vec1.get(key) || 0
      const val2 = vec2.get(key) || 0
      dotProduct += val1 * val2
      mag1 += val1 * val1
      mag2 += val2 * val2
    })

    // Add semantic similarity bonus
    vec1.forEach((val1, word1) => {
      vec2.forEach((val2, word2) => {
        if (word1 !== word2) {
          const semanticSim = this.getSemanticSimilarity(word1, word2)
          dotProduct += val1 * val2 * semanticSim * 0.3 // Weight semantic similarity lower
        }
      })
    })

    mag1 = Math.sqrt(mag1)
    mag2 = Math.sqrt(mag2)

    if (mag1 === 0 || mag2 === 0) return 0
    return Math.min(dotProduct / (mag1 * mag2), 1.0)
  }
}

export class MatrixFactorization {
  private userFactors: Map<string, number[]> = new Map()
  private itemFactors: Map<string, number[]> = new Map()
  private numFactors = 20
  private learningRate = 0.01
  private regularization = 0.02

  constructor(numFactors = 20) {
    this.numFactors = numFactors
  }

  private initializeFactors(id: string, isUser: boolean) {
    const factors = Array(this.numFactors)
      .fill(0)
      .map(() => Math.random() * 0.1)
    if (isUser) {
      this.userFactors.set(id, factors)
    } else {
      this.itemFactors.set(id, factors)
    }
  }

  train(ratings: Array<{ userId: string; itemId: string; rating: number }>, epochs = 50): void {
    // Initialize factors
    const userIds = new Set(ratings.map((r) => r.userId))
    const itemIds = new Set(ratings.map((r) => r.itemId))

    userIds.forEach((id) => this.initializeFactors(id, true))
    itemIds.forEach((id) => this.initializeFactors(id, false))

    // SGD training
    for (let epoch = 0; epoch < epochs; epoch++) {
      const shuffled = [...ratings].sort(() => Math.random() - 0.5)

      shuffled.forEach(({ userId, itemId, rating }) => {
        const userFactor = this.userFactors.get(userId)!
        const itemFactor = this.itemFactors.get(itemId)!

        // Predict rating
        const prediction = this.dotProduct(userFactor, itemFactor)
        const error = rating - prediction

        // Update factors
        for (let k = 0; k < this.numFactors; k++) {
          const userVal = userFactor[k]
          const itemVal = itemFactor[k]

          userFactor[k] += this.learningRate * (error * itemVal - this.regularization * userVal)
          itemFactor[k] += this.learningRate * (error * userVal - this.regularization * itemVal)
        }
      })

      // Decay learning rate
      this.learningRate *= 0.99
    }
  }

  private dotProduct(vec1: number[], vec2: number[]): number {
    return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0)
  }

  predict(userId: string, itemId: string): number {
    const userFactor = this.userFactors.get(userId)
    const itemFactor = this.itemFactors.get(itemId)

    if (!userFactor || !itemFactor) return 2.5 // Default neutral rating

    return Math.max(0, Math.min(5, this.dotProduct(userFactor, itemFactor)))
  }

  getRecommendations(userId: string, allItemIds: string[], topN = 10): Array<{ itemId: string; score: number }> {
    const userFactor = this.userFactors.get(userId)
    if (!userFactor) return []

    const predictions = allItemIds
      .map((itemId) => ({
        itemId,
        score: this.predict(userId, itemId),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)

    return predictions
  }
}
