const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkVendorsSchema() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'xx100100',
      database: 'supermall'
    });

    let output = 'Connected to MySQL database\n';
    
    // Check if email column exists
    const [columns] = await connection.execute('SHOW COLUMNS FROM vendors');
    output += 'Vendors table columns:\n';
    columns.forEach(column => {
      output += `${column.Field} (${column.Type})\n`;
    });
    
    // Check if email column exists
    const hasEmailColumn = columns.some(column => column.Field === 'email');
    output += `\nEmail column exists: ${hasEmailColumn}\n`;
    
    // Write results to file
    fs.writeFileSync(path.join(__dirname, 'vendors-schema-results.txt'), output);
    
    await connection.end();
  } catch (error) {
    fs.writeFileSync(path.join(__dirname, 'vendors-schema-results.txt'), `Error: ${error.message}`);
  }
}

checkVendorsSchema();