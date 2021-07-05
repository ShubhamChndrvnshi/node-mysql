const db = require('../../config/database');
const dbFunc = require('../../config/db-function');

const walletModel = {
   getWalletByUserByPassword:getWalletByUserByPassword,
   addWallet:addWallet,
   updateUserToken:updateUserToken,
   deleteWallet:deleteWallet,
   getWalletByUser: getWalletByUser,
   getWalletByUserToken: getWalletByUserToken,
   getUserExposure: getUserExposure,
   getTransactionByReqUUID: getTransactionByReqUUID,
   getTransactionByTransactionUUID: getTransactionByTransactionUUID,
   getTokenByUserToken: getTokenByUserToken,
   upsertUserToken: upsertUserToken,
   expireUserToken: expireUserToken,
   insertTransaction: insertTransaction,
   transactionExists: transactionExists,
   getWalletByUserByToken: getWalletByUserByToken,
}

function transactionExists(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM transactions WHERE transaction_uuid ='"+payload['reference_transaction_uuid']+"'",(error,rows,fields)=>{
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

function insertTransaction(payload){
    let fields = "";
    let values = "";
    Object.entries(payload).forEach(
        ([key, value]) => {
            fields = fields + key+ ","
            values = values + value+ ","
        }
    );
    fields = fields.slice(0, -1);
    values = values.slice(0, -1);
    return new Promise((resolve,reject) => {
        db.query(`INSERT IGNORE INTO transactions (${fields}) VALUES (${values})`,(error,rows,fields)=>{
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

function expireUserToken(token) {
    return new Promise((resolve,reject) => {
        db.query("UPDATE tokens set expired='Y' WHERE token='"+token+"'",(error,rows,fields)=>{
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


function upsertUserToken(payload) {
    let fields = "";
    let values = "";
    Object.entries(payload).forEach(
        ([key, value]) => {
            fields = fields + key+ ","
            values = values + value+ ","
        }
    );
    fields = fields.slice(0, -1);
    values = values.slice(0, -1);
    return new Promise((resolve,reject) => {
        db.query(`INSERT IGNORE INTO tokens (${fields}) VALUES (${values})`,(error,rows,fields)=>{
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


function getTokenByUserToken(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM Tokens WHERE username ='"+payload['user']+"' AND token = '"+payload['token']+"'",(error,rows,fields)=>{
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

function getTransactionByTransactionUUID(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM transactions WHERE transaction_uuid = '"+payload['transaction_uuid']+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });  
}

function getTransactionByReqUUID(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM transactions WHERE request_uuid = '"+payload['request_uuid']+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });  
}
function getWalletByUserByToken(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM client WHERE id = '"+payload['user_id']+"' AND token = '"+payload['token']+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });  
}

function getWalletByUserByPassword(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM client WHERE id = '"+payload['user_id']+"' AND password = '"+payload['password']+"'",(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });  
}

function getWalletByUser(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM client WHERE id = '"+payload['user_id']+"'",(error,rows,fields)=>{
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

function getUserExposure(payload) {
    return new Promise((resolve,reject) => {
        let query = "SELECT SUM(exposure) AS exposure from exposure Where clientId ='"+payload['user_id'] || payload['_id'] +"' AND status = 1";
        // console.log(query);
        db.query(query,(error,rows,fields)=>{
            if(!!error) {
                // console.log(error);
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
       });
    });  
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

function addWallet(user) {
     return new Promise((resolve,reject) => {
         db.query("INSERT INTO client(name,age,state,country)VALUES('"+user.name+"','"+user.age+"','"+user.state+"','"+user.country+"')",(error,rows,fields)=>{
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
        db.query("UPDATE Tokens set token='"+token+"' WHERE username='"+id+"'",(error,rows,fields)=>{
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


module.exports = walletModel;

