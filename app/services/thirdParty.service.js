var authenticModel = require("../models/thirdParty.model");
const fs = require("fs");
const path = require("path");
const getAuth = require("../../config/getAuth");
const NodeRSA = require('node-rsa');
const { base64encode, base64decode } = require('nodejs-base64');

let public_keyPath = path.resolve("./app/services/ProductionPublicKey.txt");
let private_keyPath = path.resolve("./app/services/ProductionPrivateKey.txt");
let secret_keyPath = path.resolve("./app/services/SecretKey.txt");

let public_key = new NodeRSA(fs.readFileSync(public_keyPath));
let private_key = new NodeRSA(fs.readFileSync(private_keyPath));
let secret_key = fs.readFileSync(secret_keyPath);

exports.gameUrl = [
  getAuth,
  (req, res) => {
    try{
        payload = jwt.decode(request.headers['X-Casino-Signature'], secret_key, algorithms=['HS256'])
        url = 'http://stg.dreamcasino.live/games/url'
        payload['country'] = 'KR'
        sign = sign_data(payload, private_key)
        headers = {'Casino-Signature': base64encode(sign)}
        response = requests.post(url, headers=headers, json=payload)

        res.json(JSON.parse(response.text))
    }catch(err){
        res.json({'error': 'Unauthorised Access'})
    }
  }
]

exports.gameList = [
  getAuth,
  (req, res) => {
    try{
        payload = jwt.decode(request.headers['x-casino-signature'], secret_key, algorithms=['HS256'])
        url = 'http://stg.dreamcasino.live/games/list'
        sign = sign_data(payload, private_key)
        headers = {'Casino-Signature': base64encode(sign)}
        response = requests.post(url, headers=headers, json=payload)

        res.json(JSON.parse(response.text))
    }catch(err){
      res.json({'error': 'Unauthorised Access'})
    }
  }
]

exports.save = [
  getAuth,
  (req, res) => {
    try {
      let payload = jwt.decode(request.headers['x-casino-signature'], secret_key, algorithms = ['HS256'])
      let response;
      try {
        payload['token_creation_time'] = new Date();
        db['tokens'].update_one({ 'token': payload['token'] }, { '$set': payload }, upsert = True)
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
  (req, res) => {
    try {
      payload = jwt.decode(req.headers['x-casino-signature'], secret_key, algorithms = ['HS256'])
      try {
        db['tokens'].update_one({ 'token': payload['token'] }, { '$set': { 'expired': 'Y' } })
        response = { 'status': 'success' }
      } catch (err) {
        res.json({ 'status': 'failed' });
      }
    } catch (err) {
      res.json({ 'error': 'Unauthorised Access' });
    }
  }
]




