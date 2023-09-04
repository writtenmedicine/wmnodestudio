const mysql = require('mysql2/promise');
require('dotenv/config');
const config = {
    mysql: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.SCHEMA_DATABASE,
        charset: "utf8mb4",
        connectionLimit: 3,
        waitForConnections: true,
        multipleStatements: true,
        // socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock', //localchange
        Promise: require('bluebird'),
    }
}
// Attempt to catch disconnects 
const pool1 = mysql.createPool(config.mysql);
pool1.on('error', function (err) {
    console.error(err);
})
pool1.on('connection', function (connection) {
    console.log('Connection established');
    // Below never get called
    connection.on('error', function (err) {
        console.error(new Date(), 'MySQL error', err.code);
    });
    connection.on('close', function (err) {
        console.error(new Date(), 'MySQL close', err);
    });
});
// Will return connection pool as a promise  
module.exports = {pool1}