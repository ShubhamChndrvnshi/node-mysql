var walletModel = require("../models/wallet.model.js");
const getAuth = require("../../config/getAuth");
const NodeRSA = require('node-rsa');
const axios = require('axios');

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


exports.balance = [
    getAuth,
    (req, res) => {
        let headers = req.headers['Casino-Signature']
        let payload = req.body;
        let verification = verify_signature(payload, headers, public_key)
        if (verification){
            try{
                // let token = db['tokens'].find_one({'username': payload['user'], 'token': payload['token']}, {'expired': 1, '_id': 0})
                walletModel.getWalletByUserToken(payload).then((token)=>{
                    if (!token){
                        let response = {
                            'user': payload['user'],
                            'status': 'RS_ERROR_INVALID_TOKEN',
                            'request_uuid': payload['request_uuid']
                        }
                        res.json(response);
                    }    
                    if (token['expired'] == 'Y'){
                        let response = {
                            'user': payload['user'],
                            'status': 'RS_ERROR_TOKEN_EXPIRED',
                            'request_uuid': payload['request_uuid']
                        }
                        res.json(response);
                    }    
                    // let required = {
                    //     'username': 1,
                    //     'balance': 1,
                    //     'casino_profit_loss': 1
                    // }
        
                   let user = db['users'].find_one({'username': payload['user']}, required)

                   walletModel.getWalletByUser(payload).then((user)=>{
                       console.log(user);
                       res.json(user);
                   });
        
                //    let available_balance = requests.post('http://endpoint/user_expo/', json={'user_id': str(user['_id'])}).json()['user_balance']
    
                //    axios.post('http://endpoint/user_expo/', {
                //        'user_id': str(user['_id'])
                //     })
                //   .then(function (response) {
                //     let available_balance = response.data.user_balance;
                //     // console.log(response);
                //     let resp = {
                //         'user': payload['user'],
                //         'status': 'RS_OK',
                //         'request_uuid': payload['request_uuid'],
                //         'balance': available_balance * 100000
                //     }    
                //     res.json(resp);
                //   })
                //   .catch(function (error) {
                //     console.log(error);
                //   });
                }).catch((err) => {
                    console.log(err);
                })
            }catch(err){
               let response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_UNKNOWN',
                    'request_uuid': payload['request_uuid']
                }
    
                let data = {
                    'user': payload['user'],
                    'token': payload['token'],
                    'date_time': new Date(),
                    'error': str(traceback.format_exc())
                }
    
                db['casino_errors'].insert_one(data)
    
                return jsonify(response)
            }        
        }else{
            response = {
                'user': payload['user'],
                'status': 'RS_ERROR_INVALID_SIGNATURE',
                'request_uuid': payload['request_uuid']
            }
            return jsonify(response)
        }
}
]

exports.updateUser = (id,userData,callback) => {
    return new Promise((resolve,reject) => {
        walletModel.updateUser(id,userData).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

exports.deleteUser = (id) => {
    return new Promise((resolve,reject) => {
        walletModel.deleteUser(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

exports.getAllUser = () => {
    return new Promise((resolve,reject) => {
        walletModel.getAllUser().then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

exports.getUserById = (id) =>{
    return new Promise((resolve,reject) => {
        walletModel.getUserById(id).then((data)=>{
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function verify_signature(data, signature, key){
    try{
        let signer = new NodeRSA(key, "pkcs1");
        let digest = new NodeRSA(data, "sha256");
        console.log("signer",signer);
        console.log("digest",digest);
        // digest.update(data)
        if (signer.verify(digest, Buffer.from(signature, 'base64'))){
            return true
        }
        return false;
    }
    catch(err){
        return false;
    }
}