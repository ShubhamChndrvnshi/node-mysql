const walletModel = require("../models/wallet.model");
const fs = require("fs");
const path = require("path");
const getAuth = require("../../config/getAuth");
const NodeRSA = require('node-rsa');
const jwt = require("jsonwebtoken");
const { base64encode } = require('nodejs-base64');
const axios = require('axios');

let private_keyPath = path.resolve("./app/services/ProductionPrivateKey.txt");
// let secret_keyPath = path.resolve("./app/services/SecretKey.txt");

// let private_key = new NodeRSA(fs.readFileSync(private_keyPath));
// let secret_key = fs.readFileSync(secret_keyPath);

exports.gameUrl = [
  getAuth,
  (req, res) => {
    try {
      // let payload = jwt.decode(req.headers['x-casino-signature'])
      let payload = req.body;
      let url = 'http://stg.dreamcasino.live/games/url';
      // payload['country'] = 'KR'
      let sign = sign_data(payload)
      // let headers = { 'casino-signature': base64encode(sign) }
      // response = reqs.post(url, headers = headers, json = payload)

      var data = JSON.stringify(payload);


      var config = {
        method: 'post',
        url: url,
        headers: {
          'casino-signature': base64encode(sign),
          'Content-Type': 'application/json',
        },
        data: data
      };

      axios(config)
        .then(function (response) {
          res.json(response.data);
        })
    } catch (err) {
      res.json({ 'error': 'Unauthorised Access' })
    }
  }
]

exports.gameList = [
  getAuth,
  (req, res) => {
    try {
      // let payload = jwt.decode(req.headers['x-casino-signature'])
      try {
        jwt.verify(req.body.token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            throw err;
          } else {
            let payload = { "partner_id": req.body.partner_id };
            let url = 'http://stg.dreamcasino.live/games/list'
            let sign = sign_data(payload)
            // let headers = { 'casino-signature': base64encode(sign) }
            // response = reqs.post(url, headers = headers, json = payload)
            var data = JSON.stringify(payload);
            var config = {
              method: 'post',
              url: url,
              headers: {
                'casino-signature': base64encode(sign),
                'Content-Type': 'application/json',
              },
              data: data
            };

            axios(config)
              .then(function (response) {
                res.json(response.data);
              })
          }
        });
      } catch (err) {
        if (err.message === "jwt expired") {
          res.json({
            'user': payload['user'],
            'status': 'RS_ERROR_TOKEN_EXPIRED',
          });
        } else {
          console.log(err);
          res.json(err);
        }
      }
      // res.json(JSON.parse(response.text))
    } catch (err) {
      res.json({ 'error': 'Unauthorised Access' })
    }
  }
]

exports.save = [
  getAuth,
  async (req, res) => {
    try {
      let payload = jwt.decode(req.headers['x-casino-signature'])
      let response;
      try {
        payload['token_creation_time'] = new Date();
        await walletModel.upsertUserToken(payload);
        // db['tokens'].update_one({ 'token': payload['token'] }, { '$set': payload }, upsert = True)
        response = { 'status': 'success' }
      } catch (err) {
        response = { 'status': 'failed' }
      }
      res.json(response)
    } catch (err) {
      res.json({ 'error': 'Unauthorised Access' });
    }
  }
]


exports.expire = [
  getAuth,
  async (req, res) => {
    try {
      let payload = jwt.decode(req.headers['x-casino-signature'])
      try {
        await walletModel.expireUserToken(payload['token']);
        // db['tokens'].update_one({ 'token': payload['token'] }, { '$set': { 'expired': 'Y' } })
        res.json({ 'status': 'success' });
      } catch (err) {
        res.json({ 'status': 'failed' });
      }
    } catch (err) {
      res.json({ 'error': 'Unauthorised Access' });
    }
  }
]


function sign_data(data) {
  sign = crypto.createSign('SHA256');
  sign.write(data);
  sign.end();
  const key = fs.readFileSync(private_keyPath);
  return sign.sign(key, 'base64');
}

// function sign_data(data) {
//   const verifiableData = data;
//   // The signature method takes the data we want to sign, the
//   // hashing algorithm, and the padding scheme, and generates
//   // a signature in the form of bytes
//   const signature = crypto.sign("sha256", Buffer.from(verifiableData), {
//     key: private_key,
//     padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
//   })
//   // digest = SHA256.new()
//   // digest.update(json.dumps(data).encode('utf-8'))
//   // signer = PKCS1_v1_5.new(key)
//   // sig = signer.sign(digest)
//   return signature
// }

