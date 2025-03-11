// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc } from 'drizzle-orm';
import * as schema from './schema';
import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';



// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_AUTH_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

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
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return c.json({ error: 'Invalid token' }, 401);
    }
    
    // Add user information to the context
    c.set('user', data.user);
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
};

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
app.get('/api/watchlist', authMiddleware, async (c) => {
  const user = c.get('user');
  
  try {
    const watchlist = await db.select().from(schema.watchlist)
      .where(eq(schema.watchlist.userId, user.id))
      .orderBy(desc(schema.watchlist.createdAt));
    
    // Трансформируем свойства для соответствия ожиданиям фронтенда
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

// Add movie to watchlist
app.post('/api/watchlist', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const movie = await c.req.json();
    
    // Валидация обязательных полей
    if (!movie.id || !movie.title) {
      return c.json({ error: 'Movie ID and title are required' }, 400);
    }
    
    // Вставка фильма в watchlist с добавлением userId
    await db.insert(schema.watchlist)
      .values({
        userId: user.id,
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || null,
        releaseDate: movie.release_date || null,
        overview: movie.overview || null,
        voteAverage: movie.vote_average || null,
      })
      .onConflictDoUpdate({
        target: [schema.watchlist.movieId, schema.watchlist.userId],
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

// Remove movie from watchlist
app.delete('/api/watchlist/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const movieId = parseInt(c.req.param('id'), 10);
    
    if (isNaN(movieId)) {
      return c.json({ error: 'Invalid movie ID' }, 400);
    }
    
    // Удаление фильма из watchlist с учётом userId
    await db.delete(schema.watchlist)
      .where(
        and(
          eq(schema.watchlist.movieId, movieId),
          eq(schema.watchlist.userId, user.id)
        )
      );
    
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

// Типы для запросов аутентификации
interface AuthRequest {
  email: string;
  password: string;
}

// Auth routes
app.post('/api/auth/signup', async (c) => {
  const { email, password }: AuthRequest = await c.req.json();
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://watch-pick.onrender.com"
      }
    });
    
    if (error) {
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ user: data.user, session: data.session });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const { email, password }: AuthRequest = await c.req.json();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ user: data.user, session: data.session });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

app.post('/api/auth/logout', authMiddleware, async (c) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// Получение информации о текущем пользователе
app.get('/api/auth/user', authMiddleware, async (c) => {
  return c.json(c.get('user'));
});

// Start the server
const port = process.env.PORT || 3000;
console.log(`Server running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch
};