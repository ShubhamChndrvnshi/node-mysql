const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const walletModel = require("../app/models/wallet.model");
const apiResponse = require("../common/apiResponse");
const logger = require("../common/logger");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const NodeRSA = require('node-rsa');

// let public_keyPath = path.resolve("./app/services/ProductionPublicKey.txt");
// let public_key = fs.readFile("./ProductionPrivateKey.txt", () => { });
// fs.readFile(public_keyPath, 'utf8', (err, data) => {
//     if (err) {
//         console.error(err)
//         return
//     }
//     public_key = data;
// })

// function signToken(token){
//   const key = new NodeRSA({b: 1024});
//   let privateKey = key.exportKey("private");
//   let publicKey = key.exportKey("public");
//   fs.writeFileSync("./app/services/ProductionPublicKey.txt",publicKey);
//   fs.writeFileSync("./app/services/ProductionPrivateKey.txt",privateKey);
//   publicKey =  new NodeRSA(publicKey);
//   privateKey =  new NodeRSA(privateKey);
//   let encrpted = publicKey.encrypt(token,"base64");
//   console.log(encrpted);
// }
const getAuth = (req, res, next) => {
  let payload = req.body;
  const credentials = req.body.user && req.body.password;
  console.log(req.headers);
  if (credentials) {
    walletModel.getWalletByUserByPass(req.body).then((data) => {
      logger.info("user login :");
      console.table(data);
      if (data.length) {
        let user = data[0];
        logger.info(user);
        const jwtPayload = {
          id: user.id,
          _id: user.id,
          user: user.id,
        };
        // console.log("jwtPayload", jwtPayload);
        const jwtData = {
          expiresIn: process.env.JWT_TIMEOUT_DURATION,
        };
        const secret = process.env.JWT_SECRET;
        //Generated JWT token with Payload and secret.
        let token = jwt.sign(jwtPayload, secret, jwtData);
        // signToken({user: user.id, token: token});
        walletModel.updateUserToken(req.body.user, token).then((data) => {
          logger.info("User token update: ");
          logger.info(data);
        }, (err) => {
          logger.error("user update error");
          logger.error(err);
        });
        res.json({
          "code": 200,
          "status": "LOGGED_IN",
          "token": token,
        });
      } else {
        res.json({
          "code": 404,
          "status": "INVALID USER",
        });
      }
    }, (err) => {
      logger.error("user data fetch error");
      logger.error(err);
    })
  } else if (req.headers["casino-signature"]) {
    let payload = req.body;
    if (req.body.token) {
      walletModel.getToken(req.body.token).then((data) => {
        if (data.length) {
          data = data[0];
          if (data.expired) {
            let response = {
              'user': payload['user'],
              'status': 'RS_ERROR_TOKEN_EXPIRED',
              'request_uuid': payload['request_uuid']
            }
            res.json(response);
          }
        }
        jwt.verify(req.body.token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            // console.log(err);
            if (err.message == "jwt expired") {
              let response = {
                'user': payload['user'],
                'status': 'RS_ERROR_TOKEN_EXPIRED',
                'request_uuid': payload['request_uuid']
              }
              res.json(response);
            } else {
              let response = {
                'user': payload['user'],
                'status': 'RS_ERROR_INVALID_TOKEN',
                'request_uuid': payload['request_uuid']
              }
              res.json(response);
            }
          } else {
            console.log(decoded)
            walletModel.getTokenByUserToken(payload).then((data)=>{
              if(data.length){
                req["decoded"] = decoded;
                next();
              }else{
                res.json({
                  'user': payload['user'],
                'status': 'RS_ERROR_INVALID_USER_TOKEN',
                'request_uuid': payload['request_uuid']
                })
              }
            })
          }
        });
      })
    }
  } else {
    let response = {
        'user': payload['user'],
        'status': 'RS_ERROR_TOKEN_NOT_FOUND',
        'request_uuid': payload['request_uuid']
    }
    res.json(response);
}
}

module.exports = getAuth;



