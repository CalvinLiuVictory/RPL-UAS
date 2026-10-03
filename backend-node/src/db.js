import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Parse bigint as JavaScript numbers to preserve parity with Laravel's integer/id serialization
pg.types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));

const connectionString = process.env.DATABASE_URL;

// Module-level pool cache to survive serverless warm containers
let poolInstance = null;

export function getPool() {
  if (!poolInstance) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }

    // Configure SSL based on environment variables
    let sslConfig;
    if (process.env.DB_SSL_CA) {
      sslConfig = {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA,
      };
    } else if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true') {
      sslConfig = {
        rejectUnauthorized: true,
      };
    } else {
      // Default for Supabase transaction pooler (port 6543) without custom root CA
      sslConfig = {
        rejectUnauthorized: false,
      };
    }

    poolInstance = new pg.Pool({
      connectionString,
      max: 3, // Conservative pool for serverless instances
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: sslConfig,
    });

    poolInstance.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err.message);
    });
  }

  return poolInstance;
}

export async function query(text, params = []) {
  const pool = getPool();
  return pool.query(text, params);
}

export async function getClient() {
  const pool = getPool();
  return pool.connect();
}

export default {
  query,
  getClient,
  getPool,
};
