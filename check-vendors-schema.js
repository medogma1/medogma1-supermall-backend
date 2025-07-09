const mysql = require('mysql2/promise');

async function checkVendorsSchema() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'xx100100',
      database: 'supermall'
    });

    console.log('Connected to MySQL database');
    
    // Check if email column exists
    const [columns] = await connection.execute('SHOW COLUMNS FROM vendors');
    console.log('Vendors table columns:');
    columns.forEach(column => {
      console.log(`${column.Field} (${column.Type})`);
    });
    
    // Check if email column exists
    const hasEmailColumn = columns.some(column => column.Field === 'email');
    console.log(`\nEmail column exists: ${hasEmailColumn}`);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkVendorsSchema();