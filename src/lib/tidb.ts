import mysql, { QueryResult } from "mysql2/promise";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const ssl: Record<string, unknown> = { rejectUnauthorized: true };
    if (process.env.TIDB_CA_PATH) {
      ssl.ca = process.env.TIDB_CA_PATH;
    }
    pool = mysql.createPool({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE || "neverland",
      ssl,
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function execute(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<mysql.ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute<mysql.ResultSetHeader>(sql, params);
  return result;
}

export async function initDatabase(): Promise<void> {
  const pool = getPool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      farm_id VARCHAR(64) NOT NULL,
      action_type VARCHAR(64) NOT NULL,
      request_body TEXT,
      response_body TEXT,
      success BOOLEAN DEFAULT TRUE,
      error_message TEXT,
      created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_farm_id (farm_id),
      INDEX idx_created_at (created_at),
      INDEX idx_action_type (action_type)
    )
  `);
}
