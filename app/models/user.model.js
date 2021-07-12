var db = require('../../config/database');
var dbFunc = require('../../config/db-function');
const logger = require("../../common/logger");

var userModel = {
   updateUserCasinoProfit: updateUserCasinoProfit,
   updateUserProfit: updateUserProfit,
}

/*************************************** */
function updateUserCasinoProfit(payload){
    return new Promise((resolve,reject) => {
        let query = "UPDATE client set curr_limit = curr_limit -"+payload.amount+" where id='"+payload.user+"'";
        logger.info(query);
        db.query(query,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });    
    })
}
/**************************************** */
function updateUserProfit(payload){
    return new Promise((resolve,reject) => {
        let query = "UPDATE client set curr_limit = curr_limit + "+payload.amount+" where id='"+payload.user+"'";
        console.log(query);
        db.query(query,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });    
    })
}


module.exports = userModel;

