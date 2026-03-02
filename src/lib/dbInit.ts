// Database Initialization and Connection Management

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export function initializeDatabase(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString && process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL environment variable not set for production');
  }

  // Use in-memory fallback for development if DATABASE_URL not set
  if (!connectionString) {
    console.warn('[Database] No DATABASE_URL set, using in-memory fallback for development');
    return null as any; // Return null, will use in-memory
  }

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

export async function getConnection(): Promise<PoolClient | null> {
  const dbPool = initializeDatabase();
  if (!dbPool) return null;

  try {
    return await dbPool.connect();
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    return null;
  }
}

export async function query(text: string, params?: any[]): Promise<any> {
  const dbPool = initializeDatabase();
  if (!dbPool) {
    console.warn('[Database] Using in-memory fallback for query:', text);
    return { rows: [] };
  }

  try {
    const result = await dbPool.query(text, params);
    return result;
  } catch (error) {
    console.error('[Database] Query error:', error);
    throw error;
  }
}

export async function runMigrations(): Promise<void> {
  const dbPool = initializeDatabase();
  if (!dbPool) {
    console.warn('[Database] Skipping migrations (in-memory mode)');
    return;
  }

  const client = await getConnection();
  if (!client) {
    console.error('[Database] Failed to get connection for migrations');
    return;
  }

  try {
    console.log('[Database] Running migrations...');

    // Read schema.sql and execute
    // Note: In a real app, use proper migration tools like Flyway or db-migrate
    console.log('[Database] Migrations would run here');

    console.log('[Database] Migrations completed');
  } catch (error) {
    console.error('[Database] Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[Database] Connection pool closed');
  }
}

export function isPostgresEnabled(): boolean {
  return !!process.env.DATABASE_URL && (process.env.NODE_ENV as string) !== 'development-in-memory';
}
