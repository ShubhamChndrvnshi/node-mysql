const walletModel = require("../models/wallet.model");
const fs = require("fs");
const path = require("path");
const getAuth = require("../../config/auth");
const NodeRSA = require('node-rsa');
const jwt = require("jsonwebtoken");
const { base64encode } = require('nodejs-base64');
const axios = require('axios');
const crypto = require("crypto");

let private_keyPath = path.resolve("./app/services/PrivateKey.txt");
function createSignature(data) {
  let sign = crypto.createSign('SHA256');
  sign.write(data);
  sign.end();
  const key = fs.readFileSync(private_keyPath, "utf8");;
  let sign_str = sign.sign(key, 'base64');
  return sign_str;
}



exports.gameUrl = [
  getAuth,
  (req, res) => {
    try {
      // let payload = jwt.decode(req.headers['x-casino-signature'])
      let payload = req.body;
      var data = JSON.stringify(payload);
      let url = 'http://stg.dreamcasino.live/games/url';
      // payload['country'] = 'KR'
      let sign = createSignature(data)
      console.log(`signature for ${data} is '${sign}'"`);

      var config = {
        method: 'post',
        url: url,
        headers: {
          'casino-signature': sign,
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
     // let payload = {"\partner_id\":+req.body.partner_id};
     let data = {partner_id:'REPLACE_YOUR_PARTNER_ID'};
     data = {partner_id: req.body.partner_id};
     data = JSON.stringify(data);

      console.log(data);
     // var data = JSON.stringify(payload);
      let url = 'http://stg.dreamcasino.live/games/list'
      let sign = createSignature(data)
      //console.log(`signature for '${data}' is '${sign}'"`);
      var config = {
        method: 'post',
        url: url,
        headers: {
          'casino-signature': sign,
          'Content-Type': 'application/json',
        },
        data: data
      };

      axios(config)
        .then(function (response) {
          res.json(response.data);
        })
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


