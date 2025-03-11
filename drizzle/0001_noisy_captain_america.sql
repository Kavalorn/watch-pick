DROP INDEX "movie_id_idx";--> statement-breakpoint
ALTER TABLE "watchlist" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "movie_id_idx" ON "watchlist" USING btree ("movie_id","user_id");