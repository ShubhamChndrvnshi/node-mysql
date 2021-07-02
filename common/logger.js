var {createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");

var logger = createLogger({
	format: format.combine(
		format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
		format.colorize(),
		format.printf(info => `${info.timestamp} ${info.level}: ${JSON.stringify(info.message)}`)
	),
	transports: [
		new (transports.Console)({ json: false, timestamp: true }),
		new transports.DailyRotateFile({ filename: "logs/debug-%DATE%.log", json: false })
	],
	exceptionHandlers: [
		new (transports.Console)({ json: false, timestamp: true }),
		new transports.DailyRotateFile({ filename: "logs/exceptions-%DATE%.log", json: false }),
		// transports.Mail({
		// 	to:"toAddress",
		// 	from:"fromAddress",
		// 	subject: "uncaughtException Report",
		// 	host:"smtp.relaxitsjustanexample.com",
		// 	username:"emailadd",
		// 	password:"password",
		// 	ssl: true
		// })
	],
	exitOnError: false
});

module.exports = logger;