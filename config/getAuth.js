const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const walletModel = require("../app/models/wallet.model");
const apiResponse = require("../common/apiResponse");
const logger = require("../common/logger");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto")

let public_keyPath = path.resolve("./app/services/ProductionPublicKey.txt");
let public_key = fs.readFile("./ProductionPrivateKey.txt", () => { });
fs.readFile(public_keyPath, 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    public_key = data;
})

function signToken(token){
  const encryptedData = crypto.publicEncrypt(
    {
      key: public_key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(token)
    // token
  )
  return encryptedData.toString();
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
          };
          // console.log("jwtPayload", jwtPayload);
          const jwtData = {
            expiresIn: process.env.JWT_TIMEOUT_DURATION,
          };
          const secret = process.env.JWT_SECRET;
          //Generated JWT token with Payload and secret.
          let token = jwt.sign(jwtPayload, secret, jwtData);
          let signedToken = signToken(JSON.stringify(jwtPayload));
          walletModel.updateUserToken(user.id, token).then((data)=>{
            logger.info("User token update: ");
            logger.info(data);
          },(err) => {
            logger.error("user update error");
            logger.error(err);
          });
          res.json({"code":200,
            "status":"LOGGED_IN",
            "token": token,
            "signedToken": signedToken,
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



  