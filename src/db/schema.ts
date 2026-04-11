import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  date,
  decimal,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================================
// 02 — Game Config
// ============================================================================

export const gameConfig = pgTable("game_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  tags: text("tags").array().default(sql`'{}'`),
});

// ============================================================================
// 03 — Artists
// ============================================================================

export const artists = pgTable(
  "artists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    spotifyId: text("spotify_id").unique(),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    country: text("country"),
    activeYears: text("active_years"),
    isSupergroup: boolean("is_supergroup").default(false),
    isActive: boolean("is_active").default(true),
    primaryLabel: text("primary_label"),
    primaryScene: text("primary_scene"),
    primaryProducer: text("primary_producer"),
    contentFlag: text("content_flag"),
    flaggedReason: text("flagged_reason"),
    contentType: text("content_type").notNull().default("music"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_artists_name_trgm").using(
      "gin",
      sql`${table.nameNormalized} gin_trgm_ops`
    ),
  ]
);

// ============================================================================
// 04 — Albums
// ============================================================================

export const albums = pgTable("albums", {
  id: uuid("id").defaultRandom().primaryKey(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "restrict" }),
  spotifyId: text("spotify_id").unique(),
  name: text("name").notNull(),
  year: integer("year"),
  producer: text("producer"),
  label: text("label"),
  recordingLocation: text("recording_location"),
  isLiveAlbum: boolean("is_live_album").default(false),
  isCompilation: boolean("is_compilation").default(false),
  contentFlag: text("content_flag"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 05 — Films
// ============================================================================

export const films = pgTable(
  "films",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tmdbFilmId: integer("tmdb_film_id").unique().notNull(),
    title: text("title").notNull(),
    titleNormalized: text("title_normalized").notNull(),
    year: integer("year").notNull(),
    posterUrl: text("poster_url"),
    countryOfOrigin: text("country_of_origin"),
    director: text("director"),
    cinematographer: text("cinematographer"),
    screenplayWriter: text("screenplay_writer"),
    productionCompany: text("production_company"),
    filmingLocation: text("filming_location"),
    budgetTier: text("budget_tier"),
    franchise: text("franchise"),
    awardsContext: text("awards_context").array(),
    contentFlag: text("content_flag"),
    flaggedReason: text("flagged_reason"),
    flaggedAt: timestamp("flagged_at", { withTimezone: true }),
    requiresFullAccount: boolean("requires_full_account").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_films_title_trgm").using(
      "gin",
      sql`${table.titleNormalized} gin_trgm_ops`
    ),
  ]
);

// ============================================================================
// 06 — Composers
// ============================================================================

export const composers = pgTable("composers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  nameNormalized: text("name_normalized").notNull(),
  nationality: text("nationality"),
  activeYears: text("active_years"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 07 — Film Composers (junction)
// ============================================================================

export const filmComposers = pgTable(
  "film_composers",
  {
    filmId: uuid("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    composerId: uuid("composer_id")
      .notNull()
      .references(() => composers.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.filmId, table.composerId] })]
);

// ============================================================================
// 08 — Songs
// ============================================================================

export const songs = pgTable("songs", {
  id: uuid("id").defaultRandom().primaryKey(),
  spotifyId: text("spotify_id").unique(),
  name: text("name").notNull(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "restrict" }),
  albumId: uuid("album_id").references(() => albums.id, {
    onDelete: "set null",
  }),
  popularity: integer("popularity"),
  isBSide: boolean("is_b_side").default(false),
  isLive: boolean("is_live").default(false),
  isCover: boolean("is_cover").default(false),
  durationMs: integer("duration_ms"),
  contentFlag: text("content_flag"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 09 — Song Film Appearances (junction)
// ============================================================================

export const songFilmAppearances = pgTable(
  "song_film_appearances",
  {
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    filmId: uuid("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    appearanceType: text("appearance_type").default("soundtrack"),
  },
  (table) => [primaryKey({ columns: [table.songId, table.filmId] })]
);

// ============================================================================
// 10 — Film Genres (junction)
// ============================================================================

export const filmGenres = pgTable(
  "film_genres",
  {
    filmId: uuid("film_id")
      .notNull()
      .references(() => films.id, { onDelete: "cascade" }),
    genre: text("genre").notNull(),
    isPrimary: boolean("is_primary").default(false),
  },
  (table) => [primaryKey({ columns: [table.filmId, table.genre] })]
);

// ============================================================================
// 11 — Artist Genres (junction)
// ============================================================================

export const artistGenres = pgTable(
  "artist_genres",
  {
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    genre: text("genre").notNull(),
    isPrimary: boolean("is_primary").default(false),
  },
  (table) => [primaryKey({ columns: [table.artistId, table.genre] })]
);

// ============================================================================
// 12 — Title Exceptions (fuzzy match overrides)
// ============================================================================

export const titleExceptions = pgTable("title_exceptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectType: text("subject_type").notNull(),
  canonical: text("canonical").notNull(),
  alsoAccept: text("also_accept").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 13 — Puzzles
// ============================================================================

export const puzzles = pgTable(
  "puzzles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mode: text("mode").notNull(),
    contentType: text("content_type").notNull().default("music"),
    // Polymorphic subject — exactly one populated per row
    artistId: uuid("artist_id").references(() => artists.id, {
      onDelete: "restrict",
    }),
    filmId: uuid("film_id").references(() => films.id, {
      onDelete: "restrict",
    }),
    composerId: uuid("composer_id").references(() => composers.id, {
      onDelete: "restrict",
    }),
    primaryGenre: text("primary_genre").notNull(),
    qualityScore: integer("quality_score"),
    published: boolean("published").default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: text("approved_by"),
    sponsor: text("sponsor"),
    requiresFullAccount: boolean("requires_full_account").default(false),
    puzzleVersion: integer("puzzle_version").default(1),
    contentFlag: text("content_flag"),
    flaggedReason: text("flagged_reason"),
    flaggedAt: timestamp("flagged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_puzzles_mode").on(table.mode),
    index("idx_puzzles_genre").on(table.primaryGenre),
    index("idx_puzzles_published").on(table.published),
    index("idx_puzzles_artist_id").on(table.artistId),
    index("idx_puzzles_film_id").on(table.filmId),
    // Enforce exactly one subject per puzzle
    check(
      "puzzles_one_subject",
      sql`(("artist_id" IS NOT NULL)::int + ("film_id" IS NOT NULL)::int + ("composer_id" IS NOT NULL)::int = 1)`
    ),
  ]
);

// ============================================================================
// 14 — Puzzle Songs (junction, ordered)
// ============================================================================

export const puzzleSongs = pgTable(
  "puzzle_songs",
  {
    puzzleId: uuid("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "restrict" }),
    displayOrder: integer("display_order").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.puzzleId, table.songId] }),
    uniqueIndex("idx_puzzle_songs_order").on(
      table.puzzleId,
      table.displayOrder
    ),
    index("idx_puzzle_songs_puzzle_id").on(table.puzzleId),
  ]
);

// ============================================================================
// 15 — Daily Schedule
// ============================================================================

export const dailySchedule = pgTable(
  "daily_schedule",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    puzzleDate: date("puzzle_date").notNull(),
    mode: text("mode").notNull(),
    genre: text("genre").notNull(),
    featuredPuzzleId: uuid("featured_puzzle_id").references(() => puzzles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_daily_schedule_date_mode").on(
      table.puzzleDate,
      table.mode
    ),
  ]
);

// ============================================================================
// 16 — Genre Adjacency
// ============================================================================

export const genreAdjacency = pgTable(
  "genre_adjacency",
  {
    genre: text("genre").notNull(),
    adjacentGenre: text("adjacent_genre").notNull(),
    contentType: text("content_type").notNull().default("music"),
    priority: integer("priority").notNull().default(1),
  },
  (table) => [
    primaryKey({
      columns: [table.genre, table.adjacentGenre, table.contentType],
    }),
    index("idx_genre_adjacency_lookup").on(
      table.genre,
      table.contentType,
      table.priority
    ),
  ]
);

// ============================================================================
// 17 — Player Profiles (18+ only)
// ============================================================================

export const playerProfiles = pgTable("player_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  displayName: text("display_name"),
  isPublic: boolean("is_public").default(false),
  genrePrefs: text("genre_prefs").array().default(sql`'{}'`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 18 — Magic Links
// ============================================================================

export const magicLinks = pgTable(
  "magic_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").unique().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemed: boolean("redeemed").default(false),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_magic_links_token").on(table.tokenHash),
  ]
);

// ============================================================================
// 19 — Player Scores
// ============================================================================

export const playerScores = pgTable(
  "player_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .references(() => puzzles.id),
    playerId: uuid("player_id").references(() => playerProfiles.id),
    score: integer("score").notNull(),
    songsUsed: integer("songs_used").notNull(),
    wrongGuesses: integer("wrong_guesses").notNull().default(0),
    guessed: boolean("guessed").notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_player_scores_puzzle_id").on(table.puzzleId),
    index("idx_player_scores_player_id").on(table.playerId),
  ]
);

// ============================================================================
// 20 — Player Puzzle History (title progression source of truth)
// ============================================================================

export const playerPuzzleHistory = pgTable(
  "player_puzzle_history",
  {
    playerId: uuid("player_id")
      .notNull()
      .references(() => playerProfiles.id, { onDelete: "cascade" }),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .references(() => puzzles.id),
    score: integer("score").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow(),
    mode: text("mode").notNull(),
    genre: text("genre"),
    wasDaily: boolean("was_daily").default(false),
    wasReplay: boolean("was_replay").default(false),
    wasChallenge: boolean("was_challenge").default(false),
  },
  (table) => [
    primaryKey({ columns: [table.playerId, table.puzzleId] }),
    index("idx_player_history_player_id").on(table.playerId),
    index("idx_player_history_genre").on(table.playerId, table.genre),
    index("idx_player_history_completed_at").on(table.completedAt),
  ]
);

// ============================================================================
// 21 — Streaks
// ============================================================================

export const streaks = pgTable("streaks", {
  playerId: uuid("player_id")
    .primaryKey()
    .references(() => playerProfiles.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastPlayedDate: date("last_played_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 22 — Session Tokens
// ============================================================================

export const sessionTokens = pgTable(
  "session_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").unique().notNull(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
    anonId: uuid("anon_id").notNull(),
    mode: text("mode").notNull(),
    timerSeconds: integer("timer_seconds").notNull(),
    graceSeconds: integer("grace_seconds").notNull(),
    maxSongs: integer("max_songs").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemed: boolean("redeemed").default(false),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_session_tokens_hash").on(table.tokenHash),
  ]
);

// ============================================================================
// 23 — Titles
// ============================================================================

export const titles = pgTable("titles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").unique().notNull(),
  tier: integer("tier").notNull(),
  description: text("description"),
  copyTone: text("copy_tone"),
  contentType: text("content_type").default("music"),
  requiresTitleIds: uuid("requires_title_ids").array(),
  isGlobalLeaderboard: boolean("is_global_leaderboard").default(false),
  leaderboardMetric: text("leaderboard_metric"),
  isBestowed: boolean("is_bestowed").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 24 — Player Titles
// ============================================================================

export const playerTitles = pgTable(
  "player_titles",
  {
    playerId: uuid("player_id")
      .notNull()
      .references(() => playerProfiles.id, { onDelete: "cascade" }),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "restrict" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow(),
    isDisplayed: boolean("is_displayed").default(true),
    lostAt: timestamp("lost_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.playerId, table.titleId] }),
    index("idx_player_titles_player").on(table.playerId),
  ]
);

// ============================================================================
// 25 — Badges
// ============================================================================

export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  triggerEvent: text("trigger_event").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 26 — Player Badges
// ============================================================================

export const playerBadges = pgTable(
  "player_badges",
  {
    playerId: uuid("player_id")
      .notNull()
      .references(() => playerProfiles.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "restrict" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow(),
    puzzleId: uuid("puzzle_id").references(() => puzzles.id, {
      onDelete: "set null",
    }),
  },
  (table) => [primaryKey({ columns: [table.playerId, table.badgeId] })]
);

// ============================================================================
// 27 — Song Popularity Votes (feedback flywheel)
// ============================================================================

export const songPopularityVotes = pgTable(
  "song_popularity_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    puzzleId: uuid("puzzle_id")
      .notNull()
      .references(() => puzzles.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => playerProfiles.id, { onDelete: "cascade" }),
    songIndexEarlier: integer("song_index_earlier").notNull(),
    songIndexLater: integer("song_index_later").notNull(),
    voteWeight: decimal("vote_weight", { precision: 3, scale: 2 }).default(
      "0.50"
    ),
    accountAgeDays: integer("account_age_days"),
    playerTier: integer("player_tier").default(0),
    votedAt: timestamp("voted_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_votes_unique").on(table.puzzleId, table.playerId),
    index("idx_votes_puzzle_id").on(table.puzzleId),
    check(
      "different_songs",
      sql`"song_index_earlier" != "song_index_later"`
    ),
  ]
);

// ============================================================================
// 28 — Deletion Log (GDPR)
// ============================================================================

export const deletionLog = pgTable("deletion_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailHash: text("email_hash").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  actionedAt: timestamp("actioned_at", { withTimezone: true }),
  actionedBy: text("actioned_by"),
  method: text("method").default("manual"),
});

// ============================================================================
// 29 — Challenges [POST-V1]
// ============================================================================

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    puzzleId: uuid("puzzle_id").references(() => puzzles.id),
    challengerId: uuid("challenger_id")
      .notNull()
      .references(() => playerProfiles.id),
    challengedId: uuid("challenged_id")
      .notNull()
      .references(() => playerProfiles.id),
    challengerScore: integer("challenger_score").notNull(),
    challengedScore: integer("challenged_score"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    winnerId: uuid("winner_id").references(() => playerProfiles.id),
    mode: text("mode").default("async"),
  },
  (table) => [
    index("idx_challenges_challenged").on(table.challengedId),
    check(
      "no_self_challenge",
      sql`"challenger_id" != "challenged_id"`
    ),
  ]
);

// ============================================================================
// 30 — Gauntlet Records [POST-V1]
// ============================================================================

export const gauntletRecords = pgTable("gauntlet_records", {
  puzzleId: uuid("puzzle_id")
    .primaryKey()
    .references(() => puzzles.id, { onDelete: "cascade" }),
  recordHolderId: uuid("record_holder_id")
    .notNull()
    .references(() => playerProfiles.id, { onDelete: "restrict" }),
  recordScore: integer("record_score").notNull(),
  setAt: timestamp("set_at", { withTimezone: true }).defaultNow(),
  challengeCount: integer("challenge_count").default(0),
  puzzleVersion: integer("puzzle_version").default(1),
});
