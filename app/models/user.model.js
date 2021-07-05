var db = require('../../config/database');
var dbFunc = require('../../config/db-function');

var userModel = {
   getAllUser:getAllUser,
   addUser:addUser,
   updateUser:updateUser,
   deleteUser:deleteUser,
   getUserByUsername:getUserByUsername,
   updateUserCasinoProfit: updateUserCasinoProfit,
}
function updateUserCasinoProfit(username, casino_profit_loss){
    return new Promise((resolve,reject) => {
        db.query("UPDATE users set casino_profit_loss = '"+casino_profit_loss+"' WHERE username = '"+username+"'",(error,rows,fields)=>{
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

function getAllUser() {
    return new Promise((resolve,reject) => {
        db.query(`CALL get_user()`,(error,rows,fields)=>{
            if(!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows[0]);
            }
       });
    });
}

function getUserByUsername(user) {
    return new Promise((resolve,reject) => {
        db.query("SELECT * FROM users WHERE username = '"+user+"'",(error,rows,fields)=>{
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

function addUser(user) {
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


function updateUser(id,user) {
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

function deleteUser(id) {
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


module.exports = userModel;

