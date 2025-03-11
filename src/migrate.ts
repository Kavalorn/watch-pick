// src/migrate.ts
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// Create a database connection
const sqlite = new Database('movies.db');
const db = drizzle(sqlite);

async function main() {
  console.log('Creating database tables if they do not exist...');
  
  try {
    // Create watchlist table
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
    
    // Check if we need to add the vote_average column to existing table
    const tableInfo = await sqlite.query("PRAGMA table_info(watchlist)").all();
    const hasVoteAverage = tableInfo.some(column => (column as any).name === 'vote_average');
    
    if (!hasVoteAverage) {
      console.log('Adding vote_average column to existing watchlist table');
      await sqlite.exec(`ALTER TABLE watchlist ADD COLUMN vote_average REAL`);
    }
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

main().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});