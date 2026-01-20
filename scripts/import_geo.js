require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importSql() {
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'sedp',
    multipleStatements: true
  };

  console.log(`Connecting to database ${dbConfig.database} on ${dbConfig.host} as ${dbConfig.user}...`);

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected.');

    const sqlPath = path.join(__dirname, 'bd_geo_data.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`File not found: ${sqlPath}`);
      process.exit(1);
    }

    console.log(`Reading SQL file from ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL commands (this might take a moment)...');
    await connection.query(sql);
    console.log('Committing transaction...');
    await connection.query('COMMIT');

    console.log('Import successfully completed!');
    await connection.end();
  } catch (err) {
    console.error('Error importing SQL:', err);
    process.exit(1);
  }
}

importSql();
