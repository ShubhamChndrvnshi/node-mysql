var db = require('../../config/database');
var dbFunc = require('../../config/db-function');

var walletModel = {
   getWalletByUserByPassword:getWalletByUserByPassword,
   addWallet:addWallet,
   updateUserToken:updateUserToken,
   deleteWallet:deleteWallet,
   getWalletByUser: getWalletByUser,
   getWalletByUserToken: getWalletByUserToken,
   getUserExposure: getUserExposure,
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
        let query = "SELECT SUM(exposure) AS exposure from exposure Where clientId ='"+payload['user_id']+"' AND status = 1";
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


module.exports = walletModel;

