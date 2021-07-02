const mysql = require('mysql');

module.exports = mysql.createPool({
    connectionLimit : 100,
    host : process.env.HOST,
    user :  process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB
})





