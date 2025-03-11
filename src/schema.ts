// src/schema.ts
import { sqliteTable, text, integer, primaryKey, real } from 'drizzle-orm/sqlite-core';

// Watchlist schema
export const watchlist = sqliteTable('watchlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  movieId: integer('movie_id').notNull().unique(),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  releaseDate: text('release_date'),
  overview: text('overview'),
  voteAverage: real('vote_average'), // Add this field for the rating
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
});

// Define types based on the schema
export type Watchlist = typeof watchlist.$inferSelect;
export type NewWatchlistEntry = typeof watchlist.$inferInsert;