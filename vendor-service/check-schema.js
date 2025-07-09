const fs = require('fs');
const pool = require('./config/database');

async function checkSchema() {
  try {
    console.log('Checking vendors table schema...');
    const [rows] = await pool.execute('DESCRIBE vendors');
    
    // Write the results to a file
    fs.writeFileSync('schema-output.json', JSON.stringify(rows, null, 2));
    console.log('Schema written to schema-output.json');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    fs.writeFileSync('schema-error.txt', err.toString());
    process.exit(1);
  }
}

checkSchema();