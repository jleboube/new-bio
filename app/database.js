const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'userbios',
  port: 5432
});

// Initialize the database
const initDb = async () => {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        bio TEXT
      )
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    // Wait a bit and try again if connection fails (useful during container startup)
    if (err.code === 'ECONNREFUSED') {
      console.log('Database connection failed. Retrying in 5 seconds...');
      setTimeout(initDb, 5000);
    }
  }
};

// Call initialization
initDb();

module.exports = {
  query: (text, params) => pool.query(text, params)
};