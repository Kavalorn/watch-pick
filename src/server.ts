// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc } from 'drizzle-orm';
import * as schema from './schema';
import 'dotenv/config';

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(process.env.SUPABASE_URL!, { prepare: false })
export const db = drizzle(client, { schema });
// Initialize Hono app
const app = new Hono();

// Configure CORS
app.use(cors({
  origin: '*', // In production, restrict this to your frontend domain
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// Serve static files (your frontend)
app.use('/*', serveStatic({ root: './public' }));

// Environment variables (replace with your actual API key)
const TMDB_API_KEY = process.env.TMDB_API_KEY || "your_tmdb_api_key";

// API Routes

// Proxy route for movie search
app.get('/api/movies/search', async (c) => {
  const query = c.req.query('query');
  
  if (!query) {
    return c.json({ error: 'Query parameter is required' }, 400);
  }
  
  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return c.json({ error: 'Failed to fetch movies' }, 500);
  }
});

// Proxy route for movie details
app.get('/api/movies/:id', async (c) => {
  const id = c.req.param('id');
  
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}`, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return c.json({ error: 'Failed to fetch movie details' }, 500);
  }
});

// Proxy route for movie credits (cast)
app.get('/api/movies/:id/credits', async (c) => {
  const id = c.req.param('id');
  
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits`, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching movie credits:', error);
    return c.json({ error: 'Failed to fetch movie credits' }, 500);
  }
});

// Proxy route for movie images
app.get('/api/movies/:id/images', async (c) => {
  const id = c.req.param('id');
  
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/images`, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching movie images:', error);
    return c.json({ error: 'Failed to fetch movie images' }, 500);
  }
});

// Add movie to watchlist
app.post('/api/watchlist', async (c) => {
  try {
    const movie = await c.req.json();
    
    // Validate required fields
    if (!movie.id || !movie.title) {
      return c.json({ error: 'Movie ID and title are required' }, 400);
    }
    
    // Insert movie into watchlist
    await db.insert(schema.watchlist)
      .values({
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        releaseDate: movie.release_date || null,
        overview: movie.overview || null,
        voteAverage: movie.vote_average || null,
      })
      .onConflictDoUpdate({
        target: schema.watchlist.movieId,
        set: {
          title: movie.title,
          posterPath: movie.poster_path || null,
          releaseDate: movie.release_date || null,
          overview: movie.overview || null,
          voteAverage: movie.vote_average || null,
        }
      });
    
    return c.json({ success: true, message: 'Movie added to watchlist' });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return c.json({ error: 'Failed to add movie to watchlist' }, 500);
  }
});

// Get watchlist
app.get('/api/watchlist', async (c) => {
  try {
    const watchlist = await db.select().from(schema.watchlist).orderBy(desc(schema.watchlist.createdAt));
    
    // Transform property names to match what frontend expects
    const transformedWatchlist = watchlist.map(item => ({
      id: item.id,
      movie_id: item.movieId, 
      title: item.title,
      poster_path: item.posterPath,
      release_date: item.releaseDate,
      overview: item.overview,
      vote_average: item.voteAverage,
      created_at: item.createdAt
    }));
    
    return c.json(transformedWatchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return c.json({ error: 'Failed to fetch watchlist' }, 500);
  }
});

// Remove movie from watchlist
app.delete('/api/watchlist/:id', async (c) => {
  try {
    const movieId = parseInt(c.req.param('id'), 10);
    
    if (isNaN(movieId)) {
      return c.json({ error: 'Invalid movie ID' }, 400);
    }
    
    // Delete movie from watchlist
    await db.delete(schema.watchlist)
      .where(eq(schema.watchlist.movieId, movieId));
    
    return c.json({ success: true, message: 'Movie removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return c.json({ error: 'Failed to remove movie from watchlist' }, 500);
  }
});

// Get actor details
app.get('/api/person/:id', async (c) => {
  const id = c.req.param('id');
  
  try {
    const response = await fetch(`https://api.themoviedb.org/3/person/${id}`, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching actor details:', error);
    return c.json({ error: 'Failed to fetch actor details' }, 500);
  }
});

// Get actor filmography
app.get('/api/person/:id/credits', async (c) => {
  const id = c.req.param('id');
  
  try {
    const response = await fetch(`https://api.themoviedb.org/3/person/${id}/movie_credits`, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching actor filmography:', error);
    return c.json({ error: 'Failed to fetch actor filmography' }, 500);
  }
});

// Start the server
const port = process.env.PORT || 3000;
console.log(`Server running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch
};