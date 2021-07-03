var db = require('../../config/database');
var dbFunc = require('../../config/db-function');

var errorModel = {
   insertError:insertError,
   updateUserToken:updateUserToken,
   deleteWallet:deleteWallet,
   getWalletByUserToken: getWalletByUserToken,
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

