import { Sequelize } from 'sequelize';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Explicitly import pg to ensure it's available for Sequelize
// This helps with Vercel serverless bundling
const { Client } = pg;

// Get database URL from environment variables
const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('⚠️ DATABASE_URL or SUPABASE_DB_URL environment variable is not set!');
  console.error('⚠️ Please set SUPABASE_DB_URL or DATABASE_URL in your environment variables');
} else {
  // Log connection info (without sensitive data)
  try {
    const urlParts = new URL(databaseUrl);
    console.log(`🔌 Database host: ${urlParts.hostname}${urlParts.port ? ':' + urlParts.port : ''}`);
    console.log(`🔌 Database name: ${urlParts.pathname.replace('/', '')}`);
  } catch (urlError) {
    console.log('🔌 Database URL is set (format validation skipped)');
  }
}

// Supabase PostgreSQL connection
// IMPORTANT: For serverless (Vercel), use Supabase Connection Pooler URL
// Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
// The pooler (port 6543) is much faster for serverless than direct connection (port 5432)
const isPooler = databaseUrl && (databaseUrl.includes('.pooler.supabase.com') || databaseUrl.includes(':6543/'));

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectModule: pg, // Explicitly provide the pg module
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // Connection pooler specific options
    ...(isPooler && {
      application_name: 'structura-app'
    })
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: process.env.RAILWAY_ENVIRONMENT ? 5 : 1, // More connections for Railway, single for serverless
    min: 0,
    acquire: process.env.RAILWAY_ENVIRONMENT ? 30000 : 15000, // 30s for Railway, 15s for serverless
    idle: 10000,
    evict: 1000, // Check for idle connections every second
    handleDisconnects: true, // Automatically reconnect on disconnect
    validate: (client) => {
      // Validate connection before use
      return client && !client._ending;
    }
  },
  // For serverless: don't keep connections alive too long
  define: {
    freezeTableName: true,
    underscored: false
  }
});

// For serverless: Don't test connection on module load
// Connection will be established on first query
// This prevents cold start issues in serverless environments

export default sequelize;
