var userModel = require("../models/wallet.model.js");

exports.balance = (req, res) => {
    return new Promise((resolve,reject) => {
        userModel.addUser(userData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

exports.updateUser = (id,userData,callback) => {
    return new Promise((resolve,reject) => {
        userModel.updateUser(id,userData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

exports.deleteUser = (id) => {
    return new Promise((resolve,reject) => {
        userModel.deleteUser(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

exports.getAllUser = () => {
    return new Promise((resolve,reject) => {
        userModel.getAllUser().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

exports.getUserById = (id) =>{
    return new Promise((resolve,reject) => {
        userModel.getUserById(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}



