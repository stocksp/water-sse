import mysql2 from 'mysql2/promise';
import { MYSQLPW, HOST, DB, DB_USER } from '$env/static/private';

export const pool = mysql2.createPool({
  host: HOST,
  //host: 'localhost',
  user: DB_USER,
  database: DB,
  password: MYSQLPW,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Test the connection after the pool is created
pool.getConnection()
  .then(connection => {
    console.log('===>MySQL Connected!');
    connection.release(); // Release the connection back to the pool
  })
  .catch(err => {
    console.error('===>Error connecting to MySQL:', err);
  });