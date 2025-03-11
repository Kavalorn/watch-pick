// src/schema.ts
import { pgTable, serial, integer, text, timestamp, real, uniqueIndex } from 'drizzle-orm/pg-core';

// Watchlist schema for PostgreSQL
export const watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').notNull(),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  releaseDate: text('release_date'),
  overview: text('overview'),
  voteAverage: real('vote_average'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
}, (table) => {
  return {
    movieIdIdx: uniqueIndex('movie_id_idx').on(table.movieId),
  }
});

// Define types based on the schema
export type Watchlist = typeof watchlist.$inferSelect;
export type NewWatchlistEntry = typeof watchlist.$inferInsert;