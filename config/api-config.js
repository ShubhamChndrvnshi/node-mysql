const express = require("express");
const path  = require('path');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const db = require('./database');
const dbfunc = require('./db-function');
const logger = require("../common/logger")
const compression = require("compression");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const walletRouter = require("../app/routes/thirdParty.route");
const thirdPartyRouter = require("../app/routes/wallet.route");
const indexRouter  = require("../app/routes/index.route");

// var schedule = require('node-schedule');
 
// var j = schedule.scheduleJob('*/1 * * * *', function(){
//   console.log('The answer to life, the universe, and everything!');
// });

dbfunc.connectionCheck.then((data) =>{
  logger.info(`DB connection status: ${data}`);
 }).catch((err) => {
  logger.error(err);
 });



const app = express();

app.use(compression({ filter: shouldCompress }));
 
function shouldCompress (req, res) {
	if (req.headers["x-no-compression"]) {
		// don't compress responses with this request header
		return false;
	}
 
	// fallback to standard filter function
	return compression.filter(req, res);
}
//set static folder
app.use(express.static(path.join(__dirname, 'public')));
//To allow cross-origin requests
app.use(cors());
// view engine setup

//don't show the log when it is test
if(process.env.NODE_ENV !== "test") {
	app.use(require("../common/httpLogger"));
}
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({ secret: "SECRET", resave: true,
	saveUninitialized: true }));


//Route Prefixes
app.use("/wallet", thirdPartyRouter);
app.use("/api/v2", walletRouter);
app.use("/", indexRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
	res.sendFile(path.join(__dirname+ "/../public/404.html"));
});

app.use((err, req, res) => {
	if(err.name == "UnauthorizedError"){
		return apiResponse.unauthorizedResponse(res, err.message);
	}
});

module.exports = app;
