const app = require("./config/api-config");
require("dotenv").config();
const PORT = process.env.PORT || 9890;
const cluster = require("cluster");
const os = require("os");
const nProc = os.cpus().length;

if(cluster.isMaster){
	for(let i = 0; i < nProc ; i++){
		cluster.fork();
	}
	cluster.on("exit", (worker, code, signal)=>{
		console.log(`Worker ${worker.process.pid} died`);
		console.log("worker: ", worker);
		console.log("code: ", code);
		console.log("signal: ", signal);
		cluster.fork();
	})
}else{
	app.listen( PORT, function() {
        cluster.isMaster ? console.log("server connected to port " + PORT) : console.log("child process: "+cluster.worker.id);
    });
}

