// src/migrate.ts
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// Create a database connection
const sqlite = new Database('movies.db');
const db = drizzle(sqlite);

async function main() {
  console.log('Creating database tables if they do not exist...');
  
  // Use the schema directly to create tables
  // This is a simple approach for development
  try {
    // Create watchlist table based on our schema definition
    await sqlite.exec(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id INTEGER NOT NULL UNIQUE,
        title TEXT NOT NULL,
        poster_path TEXT,
        release_date TEXT,
        overview TEXT,
        vote_average REAL,
        created_at INTEGER DEFAULT (unixepoch('now'))
      )
    `);
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

main().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});