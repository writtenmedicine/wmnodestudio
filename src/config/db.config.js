const mysql = require('mysql2/promise');
const mysql2 = require('mysql2')
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
    },
    mysql2: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.API_DATABASE,
        charset: "utf8mb4",
        connectionLimit: 3,
        waitForConnections: true,
        multipleStatements: true,
        // socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock', //localchange
        Promise: require('bluebird'),
    },
    mysql3: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.SCHEMA_DATABASE,
        charset: "utf8mb4",
        connectionLimit: 3,
        waitForConnections: true,
        multipleStatements: true,
        // socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock', //localchange
        // Promise: require('bluebird'),
    },
    mysql4: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.API_DATABASE,
        charset: "utf8mb4",
        connectionLimit: 3,
        waitForConnections: true,
        multipleStatements: true,
        // socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock', //localchange
        // Promise: require('bluebird'),
    }
}
// Attempt to catch disconnects 
const pool1 = mysql.createPool(config.mysql);
const pool2 = mysql.createPool(config.mysql2);
const pool3 = mysql2.createPool(config.mysql3);
const pool4 = mysql2.createPool(config.mysql4);
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
pool2.on('error', function (err) {
    console.error(err);
})
pool2.on('connection', function (connection) {
    console.log('Connection established');
    // Below never get called
    connection.on('error', function (err) {
        console.error(new Date(), 'MySQL error', err.code);
    });
    connection.on('close', function (err) {
        console.error(new Date(), 'MySQL close', err);
    });
});

pool3.on('error', function (err) {
    console.error(err);
})
pool3.on('connection', function (connection) {
    console.log('Connection established');
    // Below never get called
    connection.on('error', function (err) {
        console.error(new Date(), 'MySQL error', err.code);
    });
    connection.on('close', function (err) {
        console.error(new Date(), 'MySQL close', err);
    });
});

pool4.on('error', function (err) {
    console.error(err);
})
pool4.on('connection', function (connection) {
    console.log('Connection established');
    // Below never get called
    connection.on('error', function (err) {
        console.error(new Date(), 'MySQL error', err.code);
    });
    connection.on('close', function (err) {
        console.error(new Date(), 'MySQL close', err);
    });
});

promisePool3= pool3.promise();
promisePool4 = pool4.promise();
// Will return connection pool as a promise  
module.exports = {pool1, pool2,pool3:promisePool3,pool4:promisePool4}