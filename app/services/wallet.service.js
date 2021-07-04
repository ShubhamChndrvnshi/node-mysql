const walletModel = require("../models/wallet.model.js");
const userModel = require("../models/user.model");
const errorModel = require("../models/error.model");
const getAuth = require("../../config/getAuth");
const NodeRSA = require('node-rsa');
const axios = require('axios');
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const forge = require('node-forge');

let pkey = fs.readFileSync(path.resolve("./app/services/ProductionPublicKey.txt"));
let public_key = forge.pki.publicKeyFromPem(pkey);   // Using this key in unsigning is giving errors

// let public_keyPath = path.resolve("./app/services/ProductionPublicKey.txt");
// let private_keyPath = path.resolve("./app/services/ProductionPrivateKey.txt");
// let secret_keyPath = path.resolve("./app/services/SecretKey.txt");

// let public_key = new NodeRSA(fs.readFileSync(public_keyPath));
// let private_key = new NodeRSA(fs.readFileSync(private_keyPath));
// let secret_key = fs.readFile(secret_keyPath, () => { });

// username flied not found, so using id in place of username
exports.balance = [
    getAuth,
    (req, res) => {
        let headers = req.headers['casino-signature'];
        let payload = req.body;

        let verification = verify_signature(payload, headers);
        console.log(verification);
        if (verification) {
            try {
                // let token = db['tokens'].find_one({'username': payload['user'], 'token': payload['token']}, {'expired': 1, '_id': 0})
                walletModel.getWalletByUserToken(payload).then((token) => {
                    if (!token) {
                        let response = {
                            'user': payload['user'],
                            'status': 'RS_ERROR_INVALID_TOKEN',
                            'request_uuid': payload['request_uuid']
                        }
                        res.json(response);
                    } else {
                        let secretKey = process.env.JWT_SECRET;
                        jwt.verify(payload.token, secretKey, (err, decoded) => {
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

                                // let user = db['users'].find_one({ 'username': payload['user'] }, required)
                                walletModel.getWalletByUser(decoded).then((user) => {
                                    // console.log("user", user);

                                    walletModel.getUserExposure(decoded).then((userExposure) => {
                                        console.log("userExposure", userExposure);
                                        if (userExposure.length) {
                                            let curr_limit = user[0].curr_limit;
                                            let available_balance = curr_limit - userExposure[0].exposure;
                                            let resp = {
                                                'user': payload['user'],
                                                'status': 'RS_OK',
                                                'request_uuid': payload['request_uuid'],
                                                'balance': available_balance * 100000
                                            }
                                            res.json(resp);
                                        } else {
                                            res.json({ exposure: 0 });
                                        }
                                    }, (err) => {
                                        console.log("err1", err);
                                    }).catch((err) => {
                                        console.log("err2", err);
                                    })

                                }).catch((err) => {
                                    console.log("err3", err);
                                }, (err) => {
                                    console.log("err4", err);
                                });
                            }
                        })
                    }
                }).catch((err) => {
                    console.log(err);
                })
            } catch (err) {
                let response = {
                    'user': payload['user_id'],
                    'status': 'RS_ERROR_UNKNOWN',
                    'request_uuid': payload['request_uuid']
                }

                let data = {
                    'user': payload['user_id'],
                    'token': payload['token'],
                    'date_time': new Date(),
                    'error': JSON.stringify(err.stack)
                }

                // db['casino_errors'].insert_one(data)
                errorModel.insertError(data).then(() => { }).catch(() => { });
                res.json(response)
            }
        } else {
            response = {
                'user': payload['user_id'],
                'status': 'RS_ERROR_INVALID_SIGNATURE',
                'request_uuid': payload['request_uuid']
            }
            res.json(response)
        }
    }
]


exports.debit = [
    getAuth,
    (req, res) => {
        let date_time = new Date()
        let headers = req.headers['casino-signature']
        let payload = req.body;
        let verification = true || verify_signature(payload, headers, private_key);

        if (verification) {
            try {

                if (payload['currency'] != 'HKD') {
                    response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_WRONG_CURRENCY',
                        'request_uuid': payload['request_uuid']
                    }
                    res.json(response);
                }

                if (payload['amount'] < 0) {
                    response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_WRONG_TYPES',
                        'request_uuid': payload['request_uuid']
                    }

                    res.json(response);
                }

                // prev_response = db['transactions'].find_one({ 'request_uuid': payload['request_uuid'] });

                walletModel.getTransactionByReqUUID(payload).then((prev_response) => {

                    if (prev_response.length) {
                        prev_response = prev_response[0];
                        response = {
                            'user': payload['user'],
                            'status': 'RS_OK',
                            'request_uuid': payload['request_uuid'],
                            'balance': prev_response['balance'] * 100000
                        }
                        res.json(response);
                    } else {

                        // prev_transaction = db['transactions'].find_one({ 'transaction_uuid': payload['transaction_uuid'] })

                        walletModel.getTransactionByTransactionUUID(payload).then((prev_transaction) => {

                            if (prev_transaction.length) {

                                prev_transaction = prev_transaction[0];

                                if (payload['round'] == prev_transaction['round'] && payload['amount'] == (prev_transaction['amount'] * 100000)) {
                                    response = {
                                        'user': payload['user'],
                                        'status': 'RS_OK',
                                        'request_uuid': payload['request_uuid'],
                                        'balance': prev_transaction['balance'] * 100000
                                    }
                                    res.json(response)

                                } else {
                                    response = {
                                        'user': payload['user'],
                                        'status': 'RS_ERROR_DUPLICATE_TRANSACTION',
                                        'request_uuid': payload['request_uuid']
                                    }
                                    res.json(response)
                                }
                            }

                            // token = db['tokens'].find_one({ 'username': payload['user'], 'token': payload['token'] }, { 'expired': 1, '_id': 0 })

                            walletModel.getTransactionByTransactionUUID(payload).then((token) => {

                                if (!token.length) {
                                    response = {
                                        'user': payload['user'],
                                        'status': 'RS_ERROR_INVALID_TOKEN',
                                        'request_uuid': payload['request_uuid']
                                    }
                                    res.json(response)
                                }
                                if (token[0].token['expired'] == 'Y') {
                                    response = {
                                        'user': payload['user'],
                                        'status': 'RS_ERROR_TOKEN_EXPIRED',
                                        'request_uuid': payload['request_uuid']
                                    }
                                    res.json(response)
                                }

                                // required = {
                                //     'user': 1,
                                //     'user_status': 1,
                                //     'bet_status': 1,
                                //     'balance': 1,
                                //     'casino_profit_loss': 1
                                // }

                                // user = db['users'].find_one({ 'username': payload['user'] }, required)

                                userModel.getUserByUsername(payload['user']).then((user) => {
                                    if (user.length) {

                                        user = user[0];
                                        if (user['user_status'] == 'N' || user['bet_status'] == 'N') {
                                            response = {
                                                'user': payload['user'],
                                                'status': 'RS_ERROR_USER_DISABLED',
                                                'request_uuid': payload['request_uuid']
                                            }
                                            res.json(response)
                                        }

                                        // available_balance = requests.post('http://endpoint/user_expo/', json = { 'user_id': str(user['_id']) }).json()['user_balance']

                                        walletModel.getUserExposure(decoded).then((available_balance) => {
                                            console.log("available_balance", available_balance);
                                            if (available_balance.length) {
                                                available_balance = available_balance[0];

                                                if ((available_balance * 100000) >= payload['amount']) {
                                                    let balance = (available_balance * 100000) - payload['amount']
                                                    let profit_loss = user['casino_profit_loss'] - parseInt(payload['amount'] / 100000)

                                                    try {
                                                        let amount = parseInt(payload['amount'] / 100000)

                                                        payload['user_id'] = user['_id']
                                                        payload['transaction_time'] = date_time
                                                        payload['rolled_back'] = 'N'
                                                        payload['transaction_type'] = 'debit'
                                                        payload['amount'] = amount
                                                        payload['balance'] = parseInt(balance / 100000)

                                                        // _id = db['transactions'].insert_one(payload).inserted_id
                                                        // db['users'].update_one({ 'username': payload['user'] }, { '$set': { 'casino_profit_loss': profit_loss } })

                                                        let response = {
                                                            'user': payload['user'],
                                                            'status': 'RS_OK',
                                                            'request_uuid': payload['request_uuid'],
                                                            'balance': balance
                                                        }

                                                        res.json(response)
                                                    } catch (err) {
                                                        let response = {
                                                            'user': payload['user'],
                                                            'status': 'RS_ERROR_UNKNOWN',
                                                            'request_uuid': payload['request_uuid']
                                                        }

                                                        let data = {
                                                            'user': payload['user'],
                                                            'token': payload['token'],
                                                            'date_time': datetime.utcnow(),
                                                            'error': str(traceback.format_exc())
                                                        }

                                                        db['casino_errors'].insert_one(data)

                                                        res.json(response)
                                                    }
                                                } else {
                                                    let response = {
                                                        'user': payload['user'],
                                                        'status': 'RS_ERROR_NOT_ENOUGH_MONEY',
                                                        'request_uuid': payload['request_uuid'],
                                                        'balance': available_balance * 100000
                                                    }

                                                    res.json(response)
                                                }
                                            } else {

                                            }
                                        }, (err) => {
                                            console.log("err1", err);
                                        }).catch((err) => {
                                            console.log("err2", err);
                                        })
                                    }
                                })
                            });
                        });
                    }
                });
            } catch (err) {
                response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_UNKNOWN',
                    'request_uuid': payload['request_uuid']
                }
                data = {
                    'user': payload['user'],
                    'token': payload['token'],
                    'date_time': new Date(),
                    'error': err.stack
                }

                db['casino_errors'].insert_one(data)

                res.json(response)
            }
        } else {
            let response = {
                'user': payload['user'],
                'status': 'RS_ERROR_INVALID_SIGNATURE',
                'request_uuid': payload['request_uuid']
            }
            res.json(response)
        }
    }
]

exports.updateUser = (id, userData, callback) => {
    return new Promise((resolve, reject) => {
        walletModel.updateUser(id, userData).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

exports.deleteUser = (id) => {
    return new Promise((resolve, reject) => {
        walletModel.deleteUser(id).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    })
}

exports.getAllUser = () => {
    return new Promise((resolve, reject) => {
        walletModel.getAllUser().then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        walletModel.getUserById(id).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

function verify_signature(data, signature) {
    try {
        // const decryptedData =JSON.parse(private_key.decrypt(signature,"utf8"))
        // console.log("decoded",decryptedData);
        // console.log("data",data)
        const isVerified = crypto.verify(
            "sha256",
            Buffer.from(JSON.stringify({ user_id: data.user_id, token: data.token })),
            {
                key: pkey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            },
            Buffer.from(signature, "base64")
        )
        // if (decryptedData.token == data.token && decryptedData.user_id == data.user_id) {
        //     return true;
        // } else {
        //     return false;
        // }
        return isVerified;
    }
    catch (err) {
        console.log(err);
        return false;
    }
}