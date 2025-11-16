import "server-only"

// Sample MovieLens-style dataset embedded in the app
export const movieDataset = [
  {
    id: "tt0111161",
    title: "The Shawshank Redemption",
    genres: ["Drama", "Crime"],
    cast: ["Tim Robbins", "Morgan Freeman"],
    director: "Frank Darabont",
    overview:
      "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    rating: 9.3,
    poster_path: "/shawshank.jpg",
  },
  {
    id: "tt0068646",
    title: "The Godfather",
    genres: ["Crime", "Drama"],
    cast: ["Marlon Brando", "Al Pacino"],
    director: "Francis Ford Coppola",
    overview:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    rating: 9.2,
    poster_path: "/godfather.jpg",
  },
  {
    id: "tt1375666",
    title: "Inception",
    genres: ["Action", "Sci-Fi", "Thriller"],
    cast: ["Leonardo DiCaprio", "Marion Cotillard"],
    director: "Christopher Nolan",
    overview:
      "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
    rating: 8.8,
    poster_path: "/inception.jpg",
  },
  {
    id: "tt0109830",
    title: "Forrest Gump",
    genres: ["Drama", "Romance"],
    cast: ["Tom Hanks", "Sally Field"],
    director: "Robert Zemeckis",
    overview:
      "The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man with an IQ of 75.",
    rating: 8.8,
    poster_path: "/forrest.jpg",
  },
  {
    id: "tt0816692",
    title: "Interstellar",
    genres: ["Adventure", "Drama", "Sci-Fi"],
    cast: ["Matthew McConaughey", "Anne Hathaway"],
    director: "Christopher Nolan",
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    rating: 8.6,
    poster_path: "/interstellar.jpg",
  },
]

export const userRatingsDataset = [
  { userId: "user1", movieId: "tt0111161", rating: 5, timestamp: 1000 },
  { userId: "user1", movieId: "tt0068646", rating: 4.5, timestamp: 1001 },
  { userId: "user1", movieId: "tt1375666", rating: 4, timestamp: 1002 },
  { userId: "user2", movieId: "tt0111161", rating: 5, timestamp: 2000 },
  { userId: "user2", movieId: "tt0109830", rating: 5, timestamp: 2001 },
  { userId: "user2", movieId: "tt0816692", rating: 3.5, timestamp: 2002 },
  { userId: "user3", movieId: "tt1375666", rating: 5, timestamp: 3000 },
  { userId: "user3", movieId: "tt0816692", rating: 4.5, timestamp: 3001 },
  { userId: "user3", movieId: "tt0068646", rating: 4, timestamp: 3002 },
]
