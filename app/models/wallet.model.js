var db = require('../../config/database');
var dbFunc = require('../../config/db-function');

var walletModel = {
   getWalletByUserByPassword:getWalletByUserByPassword,
   addWallet:addWallet,
   updateWallet:updateWallet,
   deleteWallet:deleteWallet,
   getWalletByUser: getWalletByUser,
   getWalletByUserToken: getWalletByUserToken,
}

function getWalletByUserByPassword(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM client WHERE id = '"+payload['user_id']+"' AND password = "+payload['password'],(error,rows,fields)=>{
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
        db.query("SELECT * FROM client WHERE username ="+payload['user'],(error,rows,fields)=>{
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

function getWalletByUserToken(payload) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM client WHERE username ="+payload['user']+" AND token = "+payload['token'],(error,rows,fields)=>{
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
         db.query("INSERT INTO test(name,age,state,country)VALUES('"+user.name+"','"+user.age+"','"+user.state+"','"+user.country+"')",(error,rows,fields)=>{
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


function updateWallet(id,user) {
    return new Promise((resolve,reject) => {
        db.query("UPDATE test set name='"+user.name+"',age='"+user.age+"',state='"+user.state+"',country='"+user.country+"' WHERE id='"+id+"'",(error,rows,fields)=>{
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
        db.query("DELETE FROM test WHERE id='"+id+"'",(error,rows,fields)=>{
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

