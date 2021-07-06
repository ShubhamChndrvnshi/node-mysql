const db = require('../../config/database');
const dbFunc = require('../../config/db-function');

const errorModel = {
   insertError:insertError,
   updateUserToken:updateUserToken,
   deleteWallet:deleteWallet,
   getWalletByUserToken: getWalletByUserToken,
   insertErrorObject: insertErrorObject,
}



function getWalletByUserToken(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM client WHERE id ='"+payload['user_id']+"' AND token = '"+payload['token']+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });  
}

function insertError(payload) {
     return new Promise((resolve,reject) => {
         db.query("INSERT INTO casino_errors(user,token,date_time,error)VALUES('"+payload.user+"','"+payload.token+"','"+payload.date_time+"','"+payload.error+"')",(error,rows,fields)=>{
            if(error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
          });
        });
}

function insertErrorObject(payload){
    let fields = "";
    let values = "";
    Object.entries(payload).forEach(
        ([key, value]) => {
            if(typeof(value) != "number"){
                value = `'${value}'`;
            }
            fields = fields + key+ ","
            values = values + value+ ","
        }
    );
    fields = fields.slice(0, -1);
    values = values.slice(0, -1);
    return new Promise((resolve,reject) => {
        db.query(`INSERT IGNORE INTO casino_errors (${fields}) VALUES (${values})`,(error,rows,fields)=>{
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


function updateUserToken(id,token) {
    return new Promise((resolve,reject) => {
        db.query("UPDATE client set token='"+token+"' WHERE id='"+id+"'",(error,rows,fields)=>{
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

function deleteWallet(id) {
   return new Promise((resolve,reject) => {
        db.query("DELETE FROM client WHERE id='"+id+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });    
    });
}


module.exports = errorModel;

