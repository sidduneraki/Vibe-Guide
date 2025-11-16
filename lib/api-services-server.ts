import "server-only"

let spotifyAccessToken: string | null = null
let spotifyTokenExpiry = 0

async function getSpotifyAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret || clientId.length < 20 || clientSecret.length < 20) {
      return null
    }

    if (spotifyAccessToken && Date.now() < spotifyTokenExpiry) {
      return spotifyAccessToken
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      spotifyAccessToken = data.access_token
      spotifyTokenExpiry = Date.now() + (data.expires_in - 5) * 1000
      return spotifyAccessToken
    } catch (fetchError) {
      return null
    }
  } catch (error) {
    return null
  }
}

export async function getTMDBRecommendations(mood: string, moodProfile: any) {
  try {
    const moodToGenres: Record<string, number[]> = {
      happy: [35, 10751],
      sad: [18, 27],
      excited: [28, 12, 16],
      energetic: [28, 80],
      relaxed: [27, 10402],
      romantic: [10749],
      focused: [18, 80],
      thoughtful: [18, 878],
      angry: [28, 53],
      peaceful: [10751, 16],
      neutral: [35, 18, 10749],
    }

    const genreIds = moodToGenres[mood] || moodToGenres.neutral
    const API_KEY = process.env.TMDB_API_KEY

    if (!API_KEY) {
      console.warn("TMDB API key not configured, returning mock data")
      return getMockTMDBRecommendations(mood)
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreIds.join(",")}&sort_by=popularity.desc&page=1`,
    )

    if (!response.ok) throw new Error("TMDB API failed")

    const data = await response.json()
    return data.results.slice(0, 9).map((movie: any) => ({
      id: `tmdb_${movie.id}`,
      title: movie.title,
      type: "movie",
      description: movie.overview,
      image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      rating: movie.vote_average,
      matchScore: Math.round(moodProfile.confidence * (movie.vote_average / 10)),
      details: { releaseDate: movie.release_date, popularity: Math.round(movie.popularity) },
      externalLink: `https://www.imdb.com/find?q=${encodeURIComponent(movie.title)}`,
      tmdbLink: `https://www.themoviedb.org/movie/${movie.id}`,
    }))
  } catch (error) {
    console.error("TMDB error:", error)
    return getMockTMDBRecommendations(mood)
  }
}

export async function getSpotifyRecommendations(mood: string, moodProfile: any) {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret || clientId.length < 20 || clientSecret.length < 20) {
    return getMockSpotifyRecommendations(mood)
  }

  try {
    const moodToArtists: Record<string, string[]> = {
      happy: ["3TVXtAsR1Inumwj3AmJaDT", "7ltDVBr6mKbRvohxheJ9h1"],
      sad: ["6M2wZ9GZgrQXHCFfjv46we", "1Xyo4u8uXC1ZmMpatF05PJ"],
      excited: ["1Xyo4u8uXC1ZmMpatF05PJ", "246dkjvS1zLTtiykXe5h60"],
      energetic: ["246dkjvS1zLTtiykXe5h60", "6M2wZ9GZgrQXHCFfjv46we"],
      relaxed: ["1vCWHaC5f2uS3yhpwWbIA6", "3WrFJ7ztbogyGnTHbHJFl2"],
      romantic: ["6M2wZ9GZgrQXHCFfjv46we", "06HL4z0CvFAxyc27GXpf02"],
      focused: ["3WrFJ7ztbogyGnTHbHJFl2", "1vCWHaC5f2uS3yhpwWbIA6"],
      neutral: ["3TVXtAsR1Inumwj3AmJaDT", "7ltDVBr6mKbRvohxheJ9h1"],
    }

    const seedArtists = moodToArtists[mood] || moodToArtists.neutral

    const accessToken = await getSpotifyAccessToken()

    if (!accessToken) {
      return getMockSpotifyRecommendations(mood)
    }

    try {
      const moodToGenres: Record<string, string[]> = {
        happy: ["pop", "dance"],
        sad: ["acoustic", "sad"],
        excited: ["dance", "electronic"],
        energetic: ["work-out", "power-pop"],
        relaxed: ["chill", "ambient"],
        romantic: ["romance", "soul"],
        focused: ["study", "classical"],
        neutral: ["pop", "indie"],
      }

      const genres = moodToGenres[mood] || moodToGenres.neutral

      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?seed_genres=${genres.join(",")}&limit=9`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )

      if (!response.ok) {
        console.error(`[v0] Spotify API error: ${response.status}`)
        return getMockSpotifyRecommendations(mood)
      }

      const data = await response.json()

      if (!data.tracks || data.tracks.length === 0) {
        return getMockSpotifyRecommendations(mood)
      }

      return data.tracks.map((track: any) => ({
        id: `spotify_${track.id}`,
        title: track.name,
        type: "song",
        description: `by ${track.artists.map((a: any) => a.name).join(", ")}`,
        image: track.album.images[0]?.url,
        rating: 4.0 + Math.random() * 0.9,
        matchScore: Math.round(moodProfile.confidence * 0.95),
        details: {
          artist: track.artists[0].name,
          album: track.album.name,
          duration: `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}`,
        },
        spotifyLink: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
        previewUrl: track.preview_url,
      }))
    } catch (fetchError) {
      console.error("[v0] Spotify fetch error:", fetchError)
      return getMockSpotifyRecommendations(mood)
    }
  } catch (error) {
    console.error("[v0] Spotify recommendations error:", error)
    return getMockSpotifyRecommendations(mood)
  }
}

export async function getListenNotesRecommendations(mood: string, moodProfile: any) {
  const API_KEY = process.env.LISTENNOTES_API_KEY

  if (!API_KEY || API_KEY.length < 20) {
    return getMockListenNotesRecommendations(mood)
  }

  try {
    const moodToKeywords: Record<string, string[]> = {
      happy: ["happiness", "motivation", "comedy", "inspiration"],
      sad: ["emotional", "storytelling", "drama", "personal"],
      excited: ["adventure", "sports", "technology", "science"],
      energetic: ["fitness", "motivation", "interview", "podcast"],
      relaxed: ["meditation", "nature", "sleep", "wellness"],
      romantic: ["relationship", "love", "dating", "connection"],
      focused: ["learning", "business", "productivity", "education"],
      thoughtful: ["philosophy", "science", "history", "culture"],
      neutral: ["news", "talk", "storytelling", "general"],
    }

    const keywords = moodToKeywords[mood] || moodToKeywords.neutral

    const response = await fetch(
      `https://listen-api.listennotes.com/api/v2/search?q=${keywords[0]}&sort_by_date=0&type=podcast&limit=9`,
      {
        headers: { "X-ListenAPI-Key": API_KEY },
      },
    )

    if (!response.ok) {
      return getMockListenNotesRecommendations(mood)
    }

    const data = await response.json()
    return data.results.map((podcast: any) => ({
      id: `podcast_${podcast.id}`,
      title: podcast.title_original,
      type: "podcast",
      description: podcast.description_original?.substring(0, 100) + "...",
      image: podcast.image,
      rating: 4.2 + Math.random() * 0.7,
      matchScore: Math.round(moodProfile.confidence * 0.9),
      details: {
        publisher: podcast.publisher_original,
        episodes: podcast.total_episodes,
        language: podcast.language,
      },
      podcastLink: podcast.listennotes_url,
    }))
  } catch (error) {
    return getMockListenNotesRecommendations(mood)
  }
}

function getMockTMDBRecommendations(mood: string) {
  const mockMovies: Record<string, any[]> = {
    happy: [
      {
        id: "mock_1",
        title: "The Grand Budapest Hotel",
        vote_average: 8.9,
        overview: "A whimsical adventure with stunning visuals",
        poster_path: "/mock_grand_budapest.jpg",
        release_date: "2014-03-28",
        popularity: 85,
        tmdb_id: 120467,
      },
      {
        id: "mock_2",
        title: "Amélie",
        vote_average: 8.3,
        overview: "A magical journey through Paris",
        poster_path: "/mock_amelie.jpg",
        release_date: "2001-10-04",
        popularity: 72,
        tmdb_id: 194,
      },
      {
        id: "mock_5",
        title: "Paddington",
        vote_average: 8.2,
        overview: "A heartwarming family adventure",
        poster_path: "/mock_paddington.jpg",
        release_date: "2014-11-25",
        popularity: 65,
        tmdb_id: 270946,
      },
      {
        id: "mock_10",
        title: "Toy Story",
        vote_average: 8.3,
        overview: "A heartwarming tale of friendship and adventure",
        poster_path: "/mock_toy_story.jpg",
        release_date: "1995-11-22",
        popularity: 88,
        tmdb_id: 862,
      },
      {
        id: "mock_11",
        title: "Forrest Gump",
        vote_average: 8.8,
        overview: "Life is like a box of chocolates",
        poster_path: "/mock_forrest_gump.jpg",
        release_date: "1994-07-06",
        popularity: 92,
        tmdb_id: 13,
      },
      {
        id: "mock_12",
        title: "The Intouchables",
        vote_average: 8.5,
        overview: "An unlikely friendship changes everything",
        poster_path: "/mock_intouchables.jpg",
        release_date: "2011-11-02",
        popularity: 78,
        tmdb_id: 77338,
      },
      {
        id: "mock_13",
        title: "Inside Out",
        vote_average: 8.1,
        overview: "A journey through emotions",
        poster_path: "/mock_inside_out.jpg",
        release_date: "2015-06-19",
        popularity: 84,
        tmdb_id: 150540,
      },
      {
        id: "mock_14",
        title: "Sing Street",
        vote_average: 7.9,
        overview: "Music brings people together",
        poster_path: "/mock_sing_street.jpg",
        release_date: "2016-03-17",
        popularity: 66,
        tmdb_id: 339877,
      },
      {
        id: "mock_15",
        title: "La La Land",
        vote_average: 8.0,
        overview: "A modern musical love story",
        poster_path: "/mock_la_la_land.jpg",
        release_date: "2016-12-09",
        popularity: 80,
        tmdb_id: 313369,
      },
    ],
    sad: [
      {
        id: "mock_3",
        title: "Moonlight",
        vote_average: 8.4,
        overview: "A tender portrait of identity and love",
        poster_path: "/mock_moonlight.jpg",
        release_date: "2016-10-21",
        popularity: 68,
        tmdb_id: 376867,
      },
      {
        id: "mock_4",
        title: "Life is Beautiful",
        vote_average: 8.6,
        overview: "A story of hope and resilience",
        poster_path: "/mock_life_beautiful.jpg",
        release_date: "1997-12-20",
        popularity: 75,
        tmdb_id: 637,
      },
      {
        id: "mock_6",
        title: "The Shawshank Redemption",
        vote_average: 9.3,
        overview: "A profound story of hope and friendship",
        poster_path: "/mock_shawshank.jpg",
        release_date: "1994-09-23",
        popularity: 90,
        tmdb_id: 278,
      },
      {
        id: "mock_16",
        title: "The Green Mile",
        vote_average: 8.6,
        overview: "A supernatural drama about humanity",
        poster_path: "/mock_green_mile.jpg",
        release_date: "1999-12-10",
        popularity: 82,
        tmdb_id: 497,
      },
      {
        id: "mock_17",
        title: "Schindler's List",
        vote_average: 9.0,
        overview: "A powerful story of courage and sacrifice",
        poster_path: "/mock_schindlers_list.jpg",
        release_date: "1993-12-15",
        popularity: 87,
        tmdb_id: 424,
      },
      {
        id: "mock_18",
        title: "The Pursuit of Happyness",
        vote_average: 8.0,
        overview: "Never give up on your dreams",
        poster_path: "/mock_pursuit.jpg",
        release_date: "2006-12-15",
        popularity: 76,
        tmdb_id: 1402,
      },
      {
        id: "mock_19",
        title: "A Beautiful Mind",
        vote_average: 8.2,
        overview: "A brilliant mind's struggle",
        poster_path: "/mock_beautiful_mind.jpg",
        release_date: "2001-12-14",
        popularity: 74,
        tmdb_id: 453,
      },
      {
        id: "mock_20",
        title: "The Pianist",
        vote_average: 8.5,
        overview: "Survival through art and determination",
        poster_path: "/mock_pianist.jpg",
        release_date: "2002-09-25",
        popularity: 79,
        tmdb_id: 423,
      },
      {
        id: "mock_21",
        title: "Manchester by the Sea",
        vote_average: 7.8,
        overview: "A powerful story of grief and redemption",
        poster_path: "/mock_manchester.jpg",
        release_date: "2016-11-18",
        popularity: 70,
        tmdb_id: 334541,
      },
    ],
    energetic: [
      {
        id: "mock_7",
        title: "Mad Max Fury Road",
        vote_average: 8.1,
        overview: "High-octane action adventure",
        poster_path: "/mock_mad_max.jpg",
        release_date: "2015-05-15",
        popularity: 88,
        tmdb_id: 76341,
      },
      {
        id: "mock_8",
        title: "Top Gun Maverick",
        vote_average: 8.3,
        overview: "Thrilling aerial combat",
        poster_path: "/mock_top_gun.jpg",
        release_date: "2022-05-27",
        popularity: 95,
        tmdb_id: 361743,
      },
      {
        id: "mock_9",
        title: "Mission Impossible",
        vote_average: 8.0,
        overview: "Intense spy thriller",
        poster_path: "/mock_mission.jpg",
        release_date: "2023-07-12",
        popularity: 92,
        tmdb_id: 575264,
      },
      {
        id: "mock_22",
        title: "The Dark Knight",
        vote_average: 9.0,
        overview: "Epic battle between hero and villain",
        poster_path: "/mock_dark_knight.jpg",
        release_date: "2008-07-18",
        popularity: 94,
        tmdb_id: 155,
      },
      {
        id: "mock_23",
        title: "Inception",
        vote_average: 8.8,
        overview: "Mind-bending action thriller",
        poster_path: "/mock_inception.jpg",
        release_date: "2010-07-16",
        popularity: 93,
        tmdb_id: 27205,
      },
      {
        id: "mock_24",
        title: "John Wick",
        vote_average: 7.4,
        overview: "Non-stop action and revenge",
        poster_path: "/mock_john_wick.jpg",
        release_date: "2014-10-24",
        popularity: 86,
        tmdb_id: 245891,
      },
      {
        id: "mock_25",
        title: "Spider-Man: Into the Spider-Verse",
        vote_average: 8.4,
        overview: "Animated action adventure",
        poster_path: "/mock_spiderverse.jpg",
        release_date: "2018-12-14",
        popularity: 89,
        tmdb_id: 324857,
      },
      {
        id: "mock_26",
        title: "Baby Driver",
        vote_average: 7.6,
        overview: "High-speed heist thriller",
        poster_path: "/mock_baby_driver.jpg",
        release_date: "2017-06-28",
        popularity: 81,
        tmdb_id: 339403,
      },
      {
        id: "mock_27",
        title: "Edge of Tomorrow",
        vote_average: 7.6,
        overview: "Time loop action sci-fi",
        poster_path: "/mock_edge_tomorrow.jpg",
        release_date: "2014-06-06",
        popularity: 77,
        tmdb_id: 137113,
      },
    ],
  }

  return (mockMovies[mood] || mockMovies.happy).slice(0, 9).map((movie: any) => ({
    id: `tmdb_${movie.id}`,
    title: movie.title,
    type: "movie",
    description: movie.overview,
    image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
    rating: movie.vote_average,
    matchScore: 85 + Math.floor(Math.random() * 15),
    details: { releaseDate: movie.release_date, popularity: movie.popularity },
    externalLink: `https://www.themoviedb.org/movie/${movie.tmdb_id}`,
    tmdbLink: `https://www.themoviedb.org/movie/${movie.tmdb_id}`,
  }))
}

function getMockSpotifyRecommendations(mood: string) {
  const mockSongs: Record<string, any[]> = {
    happy: [
      {
        id: "1",
        name: "Walking on Sunshine",
        artist: "Katrina & The Waves",
        album: "Waves",
        image: "/walking-on-sunshine-album-art.jpg",
        duration: 180000,
        spotify_id: "05wIrZSwuaVWhcv5FfqeH0",
      },
      {
        id: "2",
        name: "Good as Hell",
        artist: "Lizzo",
        album: "Cuz I Love You",
        image: "/good-as-hell-album.jpg",
        duration: 200000,
        spotify_id: "6l8EbYRtQMgKOyc1gcDHF9",
      },
      {
        id: "11",
        name: "Shut Up and Dance",
        artist: "Walk the Moon",
        album: "Walk the Moon",
        image: "/walk-the-moon-album.jpg",
        duration: 210000,
        spotify_id: "4kbj5MwxO1bq9wjT5g9HaA",
      },
      {
        id: "16",
        name: "Happy",
        artist: "Pharrell Williams",
        album: "G I R L",
        image: "/pharrell-happy.jpg",
        duration: 233000,
        spotify_id: "60nZcImufyMA1MKQY3dcCH",
      },
      {
        id: "17",
        name: "Can't Stop the Feeling",
        artist: "Justin Timberlake",
        album: "Trolls",
        image: "/cant-stop-feeling.jpg",
        duration: 236000,
        spotify_id: "0x0xWNTLc4YY1P3Y8f5x8L",
      },
      {
        id: "18",
        name: "Don't Stop Me Now",
        artist: "Queen",
        album: "Jazz",
        image: "/queen-dont-stop.jpg",
        duration: 210000,
        spotify_id: "5T8EDUDqW7TdVmN5HsPPQY",
      },
      {
        id: "19",
        name: "Mr. Blue Sky",
        artist: "Electric Light Orchestra",
        album: "Out of the Blue",
        image: "/mr-blue-sky.jpg",
        duration: 303000,
        spotify_id: "2RlgNHKcydI9sayD2Df2xp",
      },
      {
        id: "20",
        name: "I Gotta Feeling",
        artist: "Black Eyed Peas",
        album: "The E.N.D",
        image: "/i-gotta-feeling.jpg",
        duration: 269000,
        spotify_id: "4e9cVRP6W7TdVmN5HsPPQY",
      },
      {
        id: "21",
        name: "Uptown Funk",
        artist: "Mark Ronson ft. Bruno Mars",
        album: "Uptown Special",
        image: "/uptown-funk.jpg",
        duration: 270000,
        spotify_id: "32OlwWuMpZ6b0aN2RZOeMS",
      },
    ],
    sad: [
      {
        id: "3",
        name: "Someone Like You",
        artist: "Adele",
        album: "21",
        image: "/adele-21-album.jpg",
        duration: 220000,
        spotify_id: "1zwMYTA5nlNjZxYrvBB2pV",
      },
      {
        id: "4",
        name: "Hurt",
        artist: "Johnny Cash",
        album: "American Recordings",
        image: "/johnny-cash-hurt.jpg",
        duration: 250000,
        spotify_id: "42egyydXcbNuerKQY3dcCH",
      },
      {
        id: "12",
        name: "Black",
        artist: "Pearl Jam",
        album: "Vitalogy",
        image: "/pearl-jam-black.jpg",
        duration: 240000,
        spotify_id: "2GxGLVwbrNuerKQ4aGnXP0",
      },
      {
        id: "22",
        name: "Fix You",
        artist: "Coldplay",
        album: "X&Y",
        image: "/coldplay-fix-you.jpg",
        duration: 293000,
        spotify_id: "7LVHVU3tWfcxj5aiPFEW4Q",
      },
      {
        id: "23",
        name: "The Night We Met",
        artist: "Lord Huron",
        album: "Strange Trails",
        image: "/the-night-we-met.jpg",
        duration: 207000,
        spotify_id: "0nR3YfD0RfQN2RcHfZGqpX",
      },
      {
        id: "24",
        name: "Skinny Love",
        artist: "Bon Iver",
        album: "For Emma, Forever Ago",
        image: "/skinny-love.jpg",
        duration: 238000,
        spotify_id: "01SPIYD7Q0KZLJ8RXkrMmF",
      },
      {
        id: "25",
        name: "Mad World",
        artist: "Gary Jules",
        album: "Trading Snakeoil for Wolftickets",
        image: "/mad-world.jpg",
        duration: 187000,
        spotify_id: "3JOVTQ5h8HGFnDdp4VT3MP",
      },
      {
        id: "26",
        name: "Tears in Heaven",
        artist: "Eric Clapton",
        album: "Unplugged",
        image: "/tears-in-heaven.jpg",
        duration: 275000,
        spotify_id: "4UGQ96tUkPnH3RcRNvEBbE",
      },
      {
        id: "27",
        name: "Everybody Hurts",
        artist: "R.E.M.",
        album: "Automatic for the People",
        image: "/everybody-hurts.jpg",
        duration: 315000,
        spotify_id: "3C0EjTp9glKBKwJshJlKCb",
      },
    ],
    energetic: [
      {
        id: "13",
        name: "Blinding Lights",
        artist: "The Weeknd",
        album: "After Hours",
        image: "/the-weeknd-blinding-lights.jpg",
        duration: 200000,
        spotify_id: "0VjIjW4GlUZAMYd2vXMi3b",
      },
      {
        id: "14",
        name: "Levitating",
        artist: "Dua Lipa",
        album: "Future Nostalgia",
        image: "/dua-lipa-levitating.jpg",
        duration: 203000,
        spotify_id: "39LLxExYz6ewLAcYrzQQyP",
      },
      {
        id: "15",
        name: "All The Stars",
        artist: "Kendrick Lamar & SZA",
        album: "Black Panther",
        image: "/black-panther-soundtrack.jpg",
        duration: 225000,
        spotify_id: "3qT4bUD1MaWpGrTwcvguhb",
      },
      {
        id: "28",
        name: "Eye of the Tiger",
        artist: "Survivor",
        album: "Eye of the Tiger",
        image: "/eye-of-the-tiger.jpg",
        duration: 246000,
        spotify_id: "2KH16WveTQWT6KOG9Rg6e2",
      },
      {
        id: "29",
        name: "Till I Collapse",
        artist: "Eminem ft. Nate Dogg",
        album: "The Eminem Show",
        image: "/till-i-collapse.jpg",
        duration: 297000,
        spotify_id: "4xkOaSrkexMciUUogZKVTS",
      },
      {
        id: "30",
        name: "Thunderstruck",
        artist: "AC/DC",
        album: "The Razors Edge",
        image: "/thunderstruck.jpg",
        duration: 292000,
        spotify_id: "57bgtoPSgt236HzfBOd8kj",
      },
      {
        id: "31",
        name: "Lose Yourself",
        artist: "Eminem",
        album: "8 Mile",
        image: "/lose-yourself.jpg",
        duration: 326000,
        spotify_id: "4WV6QOuvmcEudQozph7osN",
      },
      {
        id: "32",
        name: "We Will Rock You",
        artist: "Queen",
        album: "News of the World",
        image: "/we-will-rock-you.jpg",
        duration: 122000,
        spotify_id: "4pbJqGIASGPr0ZpGpnWkDn",
      },
      {
        id: "33",
        name: "Can't Hold Us",
        artist: "Macklemore & Ryan Lewis",
        album: "The Heist",
        image: "/cant-hold-us.jpg",
        duration: 259000,
        spotify_id: "4WV6QOuvmcEudQozph7osN",
      },
    ],
  }

  return (mockSongs[mood] || mockSongs.happy).slice(0, 9).map((song: any) => ({
    id: `spotify_${song.id}`,
    title: song.name,
    type: "song",
    description: `by ${song.artist}`,
    image: song.image,
    rating: 4.2 + Math.random() * 0.7,
    matchScore: 82 + Math.floor(Math.random() * 15),
    details: {
      artist: song.artist,
      album: song.album,
      duration: `${Math.floor(song.duration / 60000)}:${String(Math.floor((song.duration % 60000) / 1000)).padStart(2, "0")}`,
    },
    spotifyLink: `https://open.spotify.com/track/${song.spotify_id}`,
  }))
}

function getMockListenNotesRecommendations(mood: string) {
  const mockPodcasts: Record<string, any[]> = {
    happy: [
      {
        id: "1",
        title: "The Office Deep Dive",
        description: "Reliving the best moments from everyone's favorite show",
        image: "/the-office-podcast.jpg",
        episodes: 120,
        podcast_id: "4d3fe717742d4963a85562e9f84d8c79",
      },
      {
        id: "2",
        title: "Happy Hour Podcast",
        description: "Fun conversations with interesting people",
        image: "/happy-hour-podcast.jpg",
        episodes: 200,
        podcast_id: "42c34c68e42f47b7908e6c3c7b2e5a49",
      },
      {
        id: "10",
        title: "Stuff You Should Know",
        description: "Exploring how everything works",
        image: "/stuff-you-should-know.jpg",
        episodes: 800,
        podcast_id: "e6e5d8f16b2f4c3fa7e0e6c8a7d8f6e5",
      },
      {
        id: "11",
        title: "Conan O'Brien Needs A Friend",
        description: "Comedy legend chats with interesting guests",
        image: "/conan-podcast.jpg",
        episodes: 190,
        podcast_id: "g7h8i9j10k11l12m13n14o15p16q17r18",
      },
      {
        id: "12",
        title: "SmartLess",
        description: "Three friends surprise each other with guests",
        image: "/smartless-podcast.jpg",
        episodes: 280,
        podcast_id: "h8i9j10k11l12m13n14o15p16q17r18s19",
      },
      {
        id: "13",
        title: "My Favorite Murder",
        description: "True crime comedy podcast",
        image: "/my-favorite-murder.jpg",
        episodes: 350,
        podcast_id: "i9j10k11l12m13n14o15p16q17r18s19t20",
      },
      {
        id: "14",
        title: "The Daily Show Podcast",
        description: "Comedy news and entertainment",
        image: "/daily-show-podcast.jpg",
        episodes: 500,
        podcast_id: "j10k11l12m13n14o15p16q17r18s19t20u21",
      },
      {
        id: "15",
        title: "WTF with Marc Maron",
        description: "Intimate conversations with interesting people",
        image: "/wtf-maron.jpg",
        episodes: 1400,
        podcast_id: "k11l12m13n14o15p16q17r18s19t20u21v22",
      },
      {
        id: "16",
        title: "How Did This Get Made?",
        description: "Breaking down bad movies hilariously",
        image: "/how-did-this-get-made.jpg",
        episodes: 300,
        podcast_id: "l12m13n14o15p16q17r18s19t20u21v22w23",
      },
    ],
    sad: [
      {
        id: "3",
        title: "Serial",
        description: "True crime mystery investigations",
        image: "/serial-podcast.jpg",
        episodes: 60,
        podcast_id: "a8e5c8f16b2f4c3fa7e0e6c8a7d8f6e5",
      },
      {
        id: "4",
        title: "Where Should We Begin",
        description: "Emotional storytelling and real conversations",
        image: "/where-should-we-begin.jpg",
        episodes: 150,
        podcast_id: "b9f6d9g27c3g5d4gb8f1f7d9b8e9g7f6",
      },
      {
        id: "16",
        title: "The Moth",
        description: "Real stories told live by real people",
        image: "/the-moth-podcast.jpg",
        episodes: 450,
        podcast_id: "c1g7e1h38d4h6e5hc9g2g8e1c9f1h8g7",
      },
      {
        id: "20",
        title: "This American Life",
        description: "Stories that capture everyday moments",
        image: "/this-american-life.jpg",
        episodes: 780,
        podcast_id: "m13n14o15p16q17r18s19t20u21v22w23x24",
      },
      {
        id: "21",
        title: "S-Town",
        description: "A compelling true story mystery",
        image: "/s-town-podcast.jpg",
        episodes: 7,
        podcast_id: "n14o15p16q17r18s19t20u21v22w23x24y25",
      },
      {
        id: "22",
        title: "Radiolab",
        description: "Deep dives into fascinating stories",
        image: "/radiolab-podcast.jpg",
        episodes: 400,
        podcast_id: "o15p16q17r18s19t20u21v22w23x24y25z26",
      },
      {
        id: "23",
        title: "Heavyweight",
        description: "Helping people resolve past conflicts",
        image: "/heavyweight-podcast.jpg",
        episodes: 50,
        podcast_id: "p16q17r18s19t20u21v22w23x24y25z26a27",
      },
      {
        id: "24",
        title: "The Habitat",
        description: "Life in a simulated Mars mission",
        image: "/the-habitat-podcast.jpg",
        episodes: 8,
        podcast_id: "q17r18s19t20u21v22w23x24y25z26a27b28",
      },
      {
        id: "25",
        title: "Beautiful Stories from Anonymous People",
        description: "One hour phone calls with strangers",
        image: "/beautiful-stories.jpg",
        episodes: 300,
        podcast_id: "r18s19t20u21v22w23x24y25z26a27b28c29",
      },
    ],
    energetic: [
      {
        id: "26",
        title: "The Tim Ferriss Show",
        description: "Deconstructing world-class performers",
        image: "/tim-ferriss-show.jpg",
        episodes: 700,
        podcast_id: "s19t20u21v22w23x24y25z26a27b28c29d30",
      },
      {
        id: "27",
        title: "How I Built This",
        description: "Stories behind successful companies",
        image: "/how-i-built-this.jpg",
        episodes: 450,
        podcast_id: "t20u21v22w23x24y25z26a27b28c29d30e31",
      },
      {
        id: "28",
        title: "The Daily",
        description: "Breaking news and insights",
        image: "/the-daily-podcast.jpg",
        episodes: 1500,
        podcast_id: "u21v22w23x24y25z26a27b28c29d30e31f32",
      },
      {
        id: "29",
        title: "TED Radio Hour",
        description: "Ideas worth spreading",
        image: "/ted-radio-hour.jpg",
        episodes: 500,
        podcast_id: "v22w23x24y25z26a27b28c29d30e31f32g33",
      },
      {
        id: "30",
        title: "Freakonomics Radio",
        description: "The hidden side of everything",
        image: "/freakonomics-podcast.jpg",
        episodes: 600,
        podcast_id: "w23x24y25z26a27b28c29d30e31f32g33h34",
      },
      {
        id: "31",
        title: "The Rich Roll Podcast",
        description: "Inspiring conversations about health",
        image: "/rich-roll-podcast.jpg",
        episodes: 750,
        podcast_id: "x24y25z26a27b28c29d30e31f32g33h34i35",
      },
    ],
  }

  return (mockPodcasts[mood] || mockPodcasts.happy).slice(0, 9).map((podcast: any) => ({
    id: `podcast_${podcast.id}`,
    title: podcast.title,
    type: "podcast",
    description: podcast.description,
    image: podcast.image,
    rating: 4.3 + Math.random() * 0.6,
    matchScore: 80 + Math.floor(Math.random() * 15),
    details: { episodes: podcast.episodes },
    podcastLink: `https://www.listennotes.com/podcasts/${podcast.podcast_id}`,
  }))
}
