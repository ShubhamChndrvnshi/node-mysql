const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const walletModel = require("../app/models/wallet.model");
const apiResponse = require("../common/apiResponse");
const logger = require("../common/logger");
const fs = require("fs");
const path = require("path");
const NodeRSA = require('node-rsa');
const BASE64 = 'base64';
const UTF8 = 'utf8'
const pkcsSize = 512;
let str = "";

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
  str = token;
  pkcsType = 'pkcs8';// not empty then set to pass parameters to the empty set pkcs8
  console.log('pkcsType=' + pkcsType);

  // 1. Create RSA object and specify the length of the secret key
  let key = new NodeRSA({ b: pkcsSize });
  key.setOptions({ encryptionScheme: 'pkcs1' });// specify the encryption format

  // 2. The public and private key generated using standard pkcs8, PEM format
  // let publicPem = key.exportKey(pkcsType+'-public-pem');// output formats developed
  // let privatePem = key.exportKey(pkcsType + '-private-pem');
  // //console.log(key.$options);
  // console.log(pkcsType+'Public key: \ n',publicPem);
  // console.log(pkcsType+'Private key: \ n', privatePem);

  // --------------------- demo1: the server private key encryption public key to decrypt ----------------- --------------
  // 3. // private key data, and specify the character set and character encoding
  // let encryData = key.encryptPrivate(str, BASE64, UTF8);
  // console.log('\ N private key to encrypt data: \ n', encryData);// After the encrypted data is base64 encoded

  // 4. // public key to decrypt the data, and to specify the character set
  // let decryptData = key.decryptPublic(encryData, UTF8);
  // console.log('\ N public key to decrypt the data: \ n', decryptData);

  // --------------------- demo2: After loading the server public key to decrypt ------------------ ----
  // 1. Create RSA object and specify the length of the secret key
  // let publicKey = new NodeRSA({ b: pkcsSize });

  // 2. // import the public key, and specify pkcs standard, PEM format
  // publicKey.importKey(public_key, pkcsType+'-public-pem');

  // 3. Using public key to decrypt the data
  // let decrypted = publicKey.decryptPublic(encryData, UTF8);  
  // console.log('\ N decrypted data using the public key: \ n',decrypted);

  // --------------------- demo3: The service uses a private key signature ------------------- -----

  // 1. private
  let privateKey = new NodeRSA({ b: pkcsSize });

  2. // import the private key, and specify pkcs standard, PEM format
  console.log("private_key", private_key);
  
  privateKey.importKey(private_key, pkcsType+'-private-pem');

  let signedData = privateKey.sign(Buffer.from(str), BASE64).toString(BASE64);

  console.log('\ N using the private key signature:', signedData);

  return signedData;

  // --------------------- demo4: The service uses the public key to verify the signature ------------------ ---

  // let result = publicKey.verify(Buffer.from(str), signedData, 'Buffer', BASE64);

  // console.log('\ N signature verification results', result);
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



  