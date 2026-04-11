CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"spotify_id" text,
	"name" text NOT NULL,
	"year" integer,
	"producer" text,
	"label" text,
	"recording_location" text,
	"is_live_album" boolean DEFAULT false,
	"is_compilation" boolean DEFAULT false,
	"content_flag" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "albums_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "artist_genres" (
	"artist_id" uuid NOT NULL,
	"genre" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	CONSTRAINT "artist_genres_artist_id_genre_pk" PRIMARY KEY("artist_id","genre")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotify_id" text,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"country" text,
	"active_years" text,
	"is_supergroup" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"primary_label" text,
	"primary_scene" text,
	"primary_producer" text,
	"content_flag" text,
	"flagged_reason" text,
	"content_type" text DEFAULT 'music' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "artists_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_event" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "badges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puzzle_id" uuid,
	"challenger_id" uuid NOT NULL,
	"challenged_id" uuid NOT NULL,
	"challenger_score" integer NOT NULL,
	"challenged_score" integer,
	"issued_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"winner_id" uuid,
	"mode" text DEFAULT 'async',
	CONSTRAINT "no_self_challenge" CHECK ("challenger_id" != "challenged_id")
);
--> statement-breakpoint
CREATE TABLE "composers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"nationality" text,
	"active_years" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puzzle_date" date NOT NULL,
	"mode" text NOT NULL,
	"genre" text NOT NULL,
	"featured_puzzle_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deletion_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_hash" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"actioned_at" timestamp with time zone,
	"actioned_by" text,
	"method" text DEFAULT 'manual'
);
--> statement-breakpoint
CREATE TABLE "film_composers" (
	"film_id" uuid NOT NULL,
	"composer_id" uuid NOT NULL,
	CONSTRAINT "film_composers_film_id_composer_id_pk" PRIMARY KEY("film_id","composer_id")
);
--> statement-breakpoint
CREATE TABLE "film_genres" (
	"film_id" uuid NOT NULL,
	"genre" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	CONSTRAINT "film_genres_film_id_genre_pk" PRIMARY KEY("film_id","genre")
);
--> statement-breakpoint
CREATE TABLE "films" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tmdb_film_id" integer NOT NULL,
	"title" text NOT NULL,
	"title_normalized" text NOT NULL,
	"year" integer NOT NULL,
	"poster_url" text,
	"country_of_origin" text,
	"director" text,
	"cinematographer" text,
	"screenplay_writer" text,
	"production_company" text,
	"filming_location" text,
	"budget_tier" text,
	"franchise" text,
	"awards_context" text[],
	"content_flag" text,
	"flagged_reason" text,
	"flagged_at" timestamp with time zone,
	"requires_full_account" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "films_tmdb_film_id_unique" UNIQUE("tmdb_film_id")
);
--> statement-breakpoint
CREATE TABLE "game_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gauntlet_records" (
	"puzzle_id" uuid PRIMARY KEY NOT NULL,
	"record_holder_id" uuid NOT NULL,
	"record_score" integer NOT NULL,
	"set_at" timestamp with time zone DEFAULT now(),
	"challenge_count" integer DEFAULT 0,
	"puzzle_version" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "genre_adjacency" (
	"genre" text NOT NULL,
	"adjacent_genre" text NOT NULL,
	"content_type" text DEFAULT 'music' NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "genre_adjacency_genre_adjacent_genre_content_type_pk" PRIMARY KEY("genre","adjacent_genre","content_type")
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed" boolean DEFAULT false,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "magic_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "player_badges" (
	"player_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now(),
	"puzzle_id" uuid,
	CONSTRAINT "player_badges_player_id_badge_id_pk" PRIMARY KEY("player_id","badge_id")
);
--> statement-breakpoint
CREATE TABLE "player_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"is_public" boolean DEFAULT false,
	"genre_prefs" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "player_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "player_puzzle_history" (
	"player_id" uuid NOT NULL,
	"puzzle_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now(),
	"mode" text NOT NULL,
	"genre" text,
	"was_daily" boolean DEFAULT false,
	"was_replay" boolean DEFAULT false,
	"was_challenge" boolean DEFAULT false,
	CONSTRAINT "player_puzzle_history_player_id_puzzle_id_pk" PRIMARY KEY("player_id","puzzle_id")
);
--> statement-breakpoint
CREATE TABLE "player_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puzzle_id" uuid NOT NULL,
	"player_id" uuid,
	"score" integer NOT NULL,
	"songs_used" integer NOT NULL,
	"wrong_guesses" integer DEFAULT 0 NOT NULL,
	"guessed" boolean NOT NULL,
	"played_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_titles" (
	"player_id" uuid NOT NULL,
	"title_id" uuid NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now(),
	"is_displayed" boolean DEFAULT true,
	"lost_at" timestamp with time zone,
	CONSTRAINT "player_titles_player_id_title_id_pk" PRIMARY KEY("player_id","title_id")
);
--> statement-breakpoint
CREATE TABLE "puzzle_songs" (
	"puzzle_id" uuid NOT NULL,
	"song_id" uuid NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "puzzle_songs_puzzle_id_song_id_pk" PRIMARY KEY("puzzle_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "puzzles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" text NOT NULL,
	"content_type" text DEFAULT 'music' NOT NULL,
	"artist_id" uuid,
	"film_id" uuid,
	"composer_id" uuid,
	"primary_genre" text NOT NULL,
	"quality_score" integer,
	"published" boolean DEFAULT false,
	"approved_at" timestamp with time zone,
	"approved_by" text,
	"sponsor" text,
	"requires_full_account" boolean DEFAULT false,
	"puzzle_version" integer DEFAULT 1,
	"content_flag" text,
	"flagged_reason" text,
	"flagged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "puzzles_one_subject" CHECK ((("artist_id" IS NOT NULL)::int + ("film_id" IS NOT NULL)::int + ("composer_id" IS NOT NULL)::int = 1))
);
--> statement-breakpoint
CREATE TABLE "session_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"puzzle_id" uuid NOT NULL,
	"anon_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"timer_seconds" integer NOT NULL,
	"grace_seconds" integer NOT NULL,
	"max_songs" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed" boolean DEFAULT false,
	"redeemed_at" timestamp with time zone,
	CONSTRAINT "session_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "song_film_appearances" (
	"song_id" uuid NOT NULL,
	"film_id" uuid NOT NULL,
	"appearance_type" text DEFAULT 'soundtrack',
	CONSTRAINT "song_film_appearances_song_id_film_id_pk" PRIMARY KEY("song_id","film_id")
);
--> statement-breakpoint
CREATE TABLE "song_popularity_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puzzle_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"song_index_earlier" integer NOT NULL,
	"song_index_later" integer NOT NULL,
	"vote_weight" numeric(3, 2) DEFAULT '0.50',
	"account_age_days" integer,
	"player_tier" integer DEFAULT 0,
	"voted_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "different_songs" CHECK ("song_index_earlier" != "song_index_later")
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotify_id" text,
	"name" text NOT NULL,
	"artist_id" uuid NOT NULL,
	"album_id" uuid,
	"popularity" integer,
	"is_b_side" boolean DEFAULT false,
	"is_live" boolean DEFAULT false,
	"is_cover" boolean DEFAULT false,
	"duration_ms" integer,
	"content_flag" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "songs_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"player_id" uuid PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_played_date" date,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "title_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" text NOT NULL,
	"canonical" text NOT NULL,
	"also_accept" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tier" integer NOT NULL,
	"description" text,
	"copy_tone" text,
	"content_type" text DEFAULT 'music',
	"requires_title_ids" uuid[],
	"is_global_leaderboard" boolean DEFAULT false,
	"leaderboard_metric" text,
	"is_bestowed" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "titles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_genres" ADD CONSTRAINT "artist_genres_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenger_id_player_profiles_id_fk" FOREIGN KEY ("challenger_id") REFERENCES "public"."player_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_challenged_id_player_profiles_id_fk" FOREIGN KEY ("challenged_id") REFERENCES "public"."player_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_winner_id_player_profiles_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."player_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_schedule" ADD CONSTRAINT "daily_schedule_featured_puzzle_id_puzzles_id_fk" FOREIGN KEY ("featured_puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_composers" ADD CONSTRAINT "film_composers_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_composers" ADD CONSTRAINT "film_composers_composer_id_composers_id_fk" FOREIGN KEY ("composer_id") REFERENCES "public"."composers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_genres" ADD CONSTRAINT "film_genres_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gauntlet_records" ADD CONSTRAINT "gauntlet_records_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gauntlet_records" ADD CONSTRAINT "gauntlet_records_record_holder_id_player_profiles_id_fk" FOREIGN KEY ("record_holder_id") REFERENCES "public"."player_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_badges" ADD CONSTRAINT "player_badges_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_badges" ADD CONSTRAINT "player_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_badges" ADD CONSTRAINT "player_badges_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_puzzle_history" ADD CONSTRAINT "player_puzzle_history_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_puzzle_history" ADD CONSTRAINT "player_puzzle_history_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_scores" ADD CONSTRAINT "player_scores_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_titles" ADD CONSTRAINT "player_titles_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_titles" ADD CONSTRAINT "player_titles_title_id_titles_id_fk" FOREIGN KEY ("title_id") REFERENCES "public"."titles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_songs" ADD CONSTRAINT "puzzle_songs_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_songs" ADD CONSTRAINT "puzzle_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_composer_id_composers_id_fk" FOREIGN KEY ("composer_id") REFERENCES "public"."composers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_tokens" ADD CONSTRAINT "session_tokens_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_film_appearances" ADD CONSTRAINT "song_film_appearances_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_film_appearances" ADD CONSTRAINT "song_film_appearances_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_popularity_votes" ADD CONSTRAINT "song_popularity_votes_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_popularity_votes" ADD CONSTRAINT "song_popularity_votes_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_player_id_player_profiles_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."player_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_artists_name_trgm" ON "artists" USING gin ("name_normalized" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_challenges_challenged" ON "challenges" USING btree ("challenged_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_daily_schedule_date_mode" ON "daily_schedule" USING btree ("puzzle_date","mode");--> statement-breakpoint
CREATE INDEX "idx_films_title_trgm" ON "films" USING gin ("title_normalized" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_genre_adjacency_lookup" ON "genre_adjacency" USING btree ("genre","content_type","priority");--> statement-breakpoint
CREATE INDEX "idx_magic_links_token" ON "magic_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_player_history_player_id" ON "player_puzzle_history" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_player_history_genre" ON "player_puzzle_history" USING btree ("player_id","genre");--> statement-breakpoint
CREATE INDEX "idx_player_history_completed_at" ON "player_puzzle_history" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_player_scores_puzzle_id" ON "player_scores" USING btree ("puzzle_id");--> statement-breakpoint
CREATE INDEX "idx_player_scores_player_id" ON "player_scores" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_player_titles_player" ON "player_titles" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_puzzle_songs_order" ON "puzzle_songs" USING btree ("puzzle_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_puzzle_songs_puzzle_id" ON "puzzle_songs" USING btree ("puzzle_id");--> statement-breakpoint
CREATE INDEX "idx_puzzles_mode" ON "puzzles" USING btree ("mode");--> statement-breakpoint
CREATE INDEX "idx_puzzles_genre" ON "puzzles" USING btree ("primary_genre");--> statement-breakpoint
CREATE INDEX "idx_puzzles_published" ON "puzzles" USING btree ("published");--> statement-breakpoint
CREATE INDEX "idx_puzzles_artist_id" ON "puzzles" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "idx_puzzles_film_id" ON "puzzles" USING btree ("film_id");--> statement-breakpoint
CREATE INDEX "idx_session_tokens_hash" ON "session_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_votes_unique" ON "song_popularity_votes" USING btree ("puzzle_id","player_id");--> statement-breakpoint
CREATE INDEX "idx_votes_puzzle_id" ON "song_popularity_votes" USING btree ("puzzle_id");