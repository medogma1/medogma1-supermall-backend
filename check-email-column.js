const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkEmailColumn() {
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
    
    // Check email values
    const [vendors] = await connection.execute('SELECT id, contact_email, email FROM vendors LIMIT 5');
    output += '\nSample vendors data:\n';
    vendors.forEach(vendor => {
      output += `ID: ${vendor.id}, contact_email: ${vendor.contact_email}, email: ${vendor.email}\n`;
    });
    
    // Write results to file
    fs.writeFileSync(path.join(__dirname, 'email-column-check.txt'), output);
    
    await connection.end();
  } catch (error) {
    fs.writeFileSync(path.join(__dirname, 'email-column-check.txt'), `Error: ${error.message}`);
  }
}

checkEmailColumn();