const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const walletModel = require("../app/models/wallet.model");
const apiResponse = require("../common/apiResponse");
const logger = require("../common/logger");
const fs = require("fs");
const path = require("path");
const NodeRSA = require('node-rsa');

let public_keyPath = path.resolve("./app/services/ProductionPublicKey.txt");
let private_keyPath = path.resolve("./app/services/ProductionPrivateKey.txt");
let secret_keyPath = path.resolve("./app/services/SecretKey.txt");

let public_key = fs.readFile("./ProductionPrivateKey.txt", () => { });
let private_key = fs.readFile("./ProductionPrivateKey.txt", () => { });
let secret_key = fs.readFile("./SecretKey.txt", () => { });

fs.readFile(public_keyPath, 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    public_key = data;
    // new NodeRSA(data);
})

fs.readFile(private_keyPath, 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    private_key = data;
})
fs.readFile(secret_keyPath, 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    secret_key = data;
})
function signToken(token){
  key.sign(buffer, [encoding], [source_encoding]);
  let signer = new NodeRSA(key, "pkcs1");
}
const getAuth =  (req, res, next) => {
    const credentials = req.body.user_id && req.body.password;
    if(credentials) {
      walletModel.getWalletByUserByPassword(req.body).then((data)=>{
        logger.info("user login :");
        if(data.length){
          let user = data[0];
          logger.info(user);
          const jwtPayload = {
            id: user.id,
            user_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
          };
          // console.log("jwtPayload", jwtPayload);
          const jwtData = {
            expiresIn: process.env.JWT_TIMEOUT_DURATION,
          };
          const secret = process.env.JWT_SECRET;
          //Generated JWT token with Payload and secret.
          let token = jwt.sign(jwtPayload, secret, jwtData);
          signToken(token);
          walletModel.updateUserToken(user.id, token).then((data)=>{
            logger.info("User token update: ");
            logger.info(data);
          },(err) => {
            logger.error("user update error");
            logger.error(err);
          });
          res.json({"code":200,
            "status":"LOGGED_IN",
            "token": token
         });
        }else{
          res.json({"code":404,
            "status":"KO",
         });
        }
      },(err) => {
        logger.error("user data fetch error");
        logger.error(err);
      })
    }else if(req.headers['casino-signature']){
      next();
    }else{
      res.json({"code":404,
            "status":"KO",
         });
    }
  }

module.exports = getAuth;



  