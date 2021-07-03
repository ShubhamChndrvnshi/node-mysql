const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const walletModel = require("../app/models/wallet.model");
const apiResponse = require("../common/apiResponse");

const getAuth =  (req, res, next) => {
    const credentials = req.body.user_id && req.body.password;
    if(credentials) {
      walletModel.getWalletByUserByPassword(req.body).then((data)=>{
        if(data.length){
          let user = data[0];
          const jwtPayload = {
            id: user.id,
            token: user.token,
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
          res.json({"code":200,
            "status":"LOGGED_IN",
            "token": token
         });
        }else{
          res.json({"code":404,
            "status":"KO",
         });
        }
      },(err)=>{
        console.log(err);
      })
    }else if(req.headers['Casino-Signature']){
      next();
    }else{
      res.json({"code":404,
            "status":"KO",
         });
    }
  }

module.exports = getAuth;



  