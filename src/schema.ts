// src/schema.ts
import { pgTable, serial, integer, text, timestamp, real, uniqueIndex } from 'drizzle-orm/pg-core';

// Watchlist schema for PostgreSQL
export const watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Добавить поле userId
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
    movieIdIdx: uniqueIndex('movie_id_idx').on(table.movieId, table.userId), // Изменить индекс
  }
});

// Обновить типы на основе схемы
export type Watchlist = typeof watchlist.$inferSelect;
export type NewWatchlistEntry = typeof watchlist.$inferInsert;