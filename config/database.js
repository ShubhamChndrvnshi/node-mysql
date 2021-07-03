const mysql = require('mysql');
require("dotenv").config();

let connObj = {
    connectionLimit : 100,
    host : process.env.HOST,
    user :  "admin",
    password: process.env.PASSWORD,
    database: process.env.DB
};
module.exports = mysql.createPool(connObj)