/**
 * Retry the 4 FK constraints that failed due to orphaned records (now cleaned up)
 */
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname, port: parseInt(u.port) || 4000,
    user: u.username, password: decodeURIComponent(u.password),
    database: u.pathname.replace("/", ""), ssl: { rejectUnauthorized: true },
  };
}

async function main() {
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection(parseDbUrl(DATABASE_URL));

  const fks = [
    ["protocol_assignments", "patientId", "patients", "id", "fk_assignments_patientId", "CASCADE"],
    ["protocol_assignments", "protocolId", "protocols", "id", "fk_assignments_protocolId", "CASCADE"],
    ["notifications", "userId", "users", "id", "fk_notifications_userId", "CASCADE"],
    ["biomarker_custom_metrics", "patientId", "patients", "id", "fk_biomarker_custom_metrics_patientId", "CASCADE"],
  ];

  for (const [table, column, refTable, refColumn, fkName, onDelete] of fks) {
    try {
      const [existing] = await conn.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
         WHERE TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        [table, fkName]
      );
      if (existing.length > 0) {
        console.log(`[SKIP] ${fkName} already exists`);
        continue;
      }
      await conn.query(
        `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fkName}\` 
         FOREIGN KEY (\`${column}\`) REFERENCES \`${refTable}\`(\`${refColumn}\`) 
         ON DELETE ${onDelete}`
      );
      console.log(`[OK]   ${fkName}: ${table}(${column}) -> ${refTable}(${refColumn})`);
    } catch (err) {
      console.error(`[ERR]  ${fkName}: ${err.message}`);
    }
  }

  await conn.end();
  console.log("Done!");
}

main().catch(e => { console.error(e); process.exit(1); });
