var authenticModel = require("../models/thirdParty.model");
const fs = require("fs");
const path = require("path");
const getAuth = require("../../config/getAuth");
const NodeRSA = require('node-rsa');

// with open('/path/ProductionPublicKey.txt', 'r') as file:
let absPath = path.resolve("./ProductionPublicKey.txt");
fs.readFile(absPath, 'utf-8' ,(err, data)=>{
    console.log("data key",data, absPath);
});
// let private_key = fs.readFile("./ProductionPrivateKey.txt",()=>{});
// let secret_key = fs.readFile("./SecretKey.txt",()=>{});
// const key = new NodeRSA()
// RSA.importKey(file.read())
// console.log("public key",public_key);
// console.log(private_key);
// console.log(secret_key);
// with open('/path/ProductionPrivateKey.txt', 'r') as file:
//     private_key = RSA.importKey(file.read())

// with open('/path/SecretKey.txt', 'r') as file:
//     secret_key = file.read()


exports.save = [
    getAuth,
    (req,res) => {
        return new Promise((resolve,reject) => {
            authenticModel.authentic(authenticData).then((data)=>{
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        })
    }
]


exports.expire = [
    getAuth,
    (req,res ) => {
    
        return new Promise((resolve,reject) => {
            authenticModel.signup(signUpData).then((data)=>{
                resolve(data);
            }).catch((err) => {
                reject(err);
            })
        })
       
    }
]


