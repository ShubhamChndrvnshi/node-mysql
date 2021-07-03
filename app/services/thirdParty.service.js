var authenticModel = require("../models/thirdParty.model");
const fs = require("fs");
const path = require("path");
const getAuth = require("../../config/getAuth");
const NodeRSA = require('node-rsa');

let public_keyPath = path.resolve("./app/services/ProductionPublicKey.txt");
let private_keyPath = path.resolve("./app/services/ProductionPrivateKey.txt");
let secret_keyPath = path.resolve("./app/services/SecretKey.txt");

let public_key = fs.readFile("./ProductionPrivateKey.txt");
let private_key = fs.readFile("./ProductionPrivateKey.txt");
let secret_key = fs.readFile("./SecretKey.txt");

fs.readFile(public_keyPath, 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    public_key = data;
    // new NodeRSA(data);
  })

  fs.readFile(private_keyPath, 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    private_key = data;
  })
fs.readFile(secret_keyPath, 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    secret_key = data;
  })



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


