const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  family: 4,
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ Error en pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta una query simple
 * @param {string} text  - SQL
 * @param {Array}  params - Parámetros
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtiene un cliente del pool para transacciones manuales
 * Uso:
 *   const client = await getClient();
 *   try {
 *     await client.query('BEGIN');
 *     ...
 *     await client.query('COMMIT');
 *   } catch (e) {
 *     await client.query('ROLLBACK');
 *   } finally {
 *     client.release();
 *   }
 */
const getClient = () => pool.connect();

module.exports = { query, getClient };
