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
let secretKey = process.env.JWT_SECRET;
let pkey = fs.readFileSync(path.resolve("./app/services/ProductionPublicKey.pem"));
let public_key = forge.pki.publicKeyFromPem(pkey);   // Using this key in unsigning is giving errors

let public_keyPath = path.resolve("./app/services/PublicKey.pem");


// username flied not found, so using id in place of username
exports.balance = [
    getAuth,
    (req, res) => {
        let headers = req.headers['casino-signature'];
        let payload = req.body;
        let data = JSON.stringify(req.body);
        let verification = verifySignature(data, headers);
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
                                    console.log("user", user);

                                    walletModel.getUserExposure(decoded).then((userExposure) => {
                                        // console.log("userExposure", userExposure);
                                        if (userExposure.length) {
                                            let curr_limit = user[0].curr_limit;
                                            let available_balance = curr_limit - userExposure[0].exposure;
                                            let resp = {
                                                'user': payload['user'],
                                                'status': 'RS_OK',
                                                'request_uuid': payload['request_uuid'],
                                                'balance': available_balance * 100000,
                                                'currency': "HKD"
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
                    'user': payload['user'],
                    'status': 'RS_ERROR_UNKNOWN',
                    'request_uuid': payload['request_uuid']
                }

                let data = {
                    'user': payload['user'],
                    'token': payload['token'],
                    'date_time': 'NOW()',
                    'error': JSON.stringify(err.stack)
                }

                // db['casino_errors'].insert_one(data)
                errorModel.insertError(data).then(() => { }).catch(() => { });
                res.json(response)
            }
        } else {
            response = {
                'user': payload['user'],
                'status': 'RS_ERROR_INVALID_SIGNATURE',
                'request_uuid': payload['request_uuid']
            }
            res.json(response)
        }
    }
]


exports.debit = [
    getAuth,
    async (req, res) => {
        let date_time = new Date()
        let headers = req.headers['casino-signature']
        let payload = req.body;
        let data = JSON.stringify(payload);
        console.log( data);
        let verification = verifySignature(data, headers);

        if (verification) {
            try {
                let jwt_decoded;
                jwt.verify(payload.token, secretKey, (err, decoded) => {
                    if (err) {
                        // console.log(err);
                        if (err.message == "jwt expired") {
                            let response = {
                                'user': payload['user'],
                                'status': 'RS_ERROR_TOKEN_EXPIRED',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        } else {
                            let response = {
                                'user': payload['user'],
                                'status': 'RS_ERROR_INVALID_TOKEN',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        }
                    } else {
                        if (payload['currency'] != 'HKD') {
                            response = {
                                'user': payload['user'],
                                'status': 'RS_ERROR_WRONG_CURRENCY',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        }

                        if (payload['amount'] < 0) {
                            response = {
                                'user': payload['user'],
                                'status': 'RS_ERROR_WRONG_TYPES',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        }

                        jwt_decoded = decoded;

                    }
                });

                walletModel.getTransactionByReqUUID(payload).then((prev_req) => {
                    if (prev_req.length > 0) {
                        let response = {
                            'user': payload['user'],
                            'status': 'RS_ERROR_DUPLICATE_REQUEST',
                            'request_uuid': payload['request_uuid']
                        }
                        response.currency = payload['currency'];
                        res.json(response)
                    } else {
                        walletModel.getTransactionByTransactionUUID(payload).then(async (prev_tran) => {
                            if (prev_tran.length > 0) {
                                let response = {
                                    'user': payload['user'],
                                    'status': 'RS_ERROR_DUPLICATE_TRANSACTION',
                                    'request_uuid': payload['request_uuid']
                                }
                                response.currency = payload['currency'];
                                res.json(response)
                            } else {
                                await userModel.updateUserCasinoProfit(payload);
                                getBalance(jwt_decoded, payload).then(async (responsed) => {

                                    console.log("jhhhsvjvsdjvsjv", responsed)


                                    let tran_fields = " (amount, transactionId, roundId, status, clientId, creditId, winAmount )";
                                    let tran_values = ` ( ${payload.amount}, '${payload.transaction_uuid}',  '${payload.round}' , 1 ,  '${payload.user}', '${payload.creditId || payload.transaction_uuid}', '${payload.winAmount || 0}')`;
                                    await walletModel.insertTransactionCbet(tran_fields, tran_values).then(() => { }, (err) => {
                                        if (err.message.includes("Duplicate entry")) {
                                            let response = {
                                                'user': payload['user'],
                                                'status': 'RS_ERROR_DUPLICATE_CREDITID',
                                                'request_uuid': payload['request_uuid']
                                            }
                                            response.currency = payload['currency'];
                                            res.json(response)
                                        }
                                    });

                                    tran_fields = " (balance, request_uuid, transaction_uuid, user, rolled_back, transaction_type, supplier_user, supplier_transaction_id )";
                                    tran_values = ` ( ${responsed.balance}, '${payload['request_uuid']}', '${payload.transaction_uuid}', '${payload.user}', 'N', 'debit', '${payload.supplier_user}', '${payload.supplier_transaction_id}' )`;
                                    await walletModel.insertTransactionFieldValues(tran_fields, tran_values);
                                    responsed.currency = payload['currency'];

                                    res.json(responsed);

                                    // res.json(response0);
                                });
                            }
                        })
                    }
                })
                


            } catch (err) {
                console.log(err);
                let response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_UNKNOWN',
                    'request_uuid': payload['request_uuid']
                }
                response.currency = payload['currency'];
                let data = {
                    'user': payload['user'],
                    'token': payload['token'],
                    'date_time': 'NOW()',
                    'error': JSON.stringify(err.stack)
                }

                // db['casino_errors'].insert_one(data)
                await errorModel.insertErrorObject(data);

                res.json(response)
            }
        } else {
            let response = {
                'user': payload['user'],
                'status': 'RS_ERROR_INVALID_SIGNATURE',
                'request_uuid': payload['request_uuid']
            }
            response.currency = payload['currency'];
            res.json(response)
        }
    }
]

exports.credit = [
    getAuth,
    async (req, res) => {
        let date_time = new Date();
        let headers = req.headers['casino-signature']
        let payload = req.body;
       // payload["user"] = payload["user"];
        let data = JSON.stringify(payload);
        console.log( data);
        let verification = verifySignature(data, headers);
        console.log( verification);
        if (verification) {
            try {
                let decoded;
                jwt.verify(payload.token, secretKey, (err, decod) => {
                    if (err) {
                        // console.log(err);
                        if (err.message == "jwt expired") {
                            let response = {
                                'user': payload['user'],
                                'status': 'RS_ERROR_TOKEN_EXPIRED',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        } else {
                            let response = {
                                'user': payload['user'],
                                'status': 'RS_ERROR_INVALID_TOKEN',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        }
                    } else {
                        decoded = decod;
                    }
                });

                if (payload['currency'] != 'KRW') {
                    let response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_WRONG_CURRENCY',
                        'request_uuid': payload['request_uuid']
                    }
                    response.currency = payload['currency'];
                    res.json(response);
                }

                // prev_response = db['transactions'].find_one({ 'request_uuid': payload['request_uuid'] })

                // prev_transaction = db['transactions'].find_one({ 'transaction_uuid': payload['transaction_uuid'] })

                walletModel.getTransactionByReqUUID(payload).then((prev_req) => {
                    if (prev_req.length) {
                        let response = {
                            'user': payload['user'],
                            'status': 'RS_ERROR_DUPLICATE_REQUEST',
                            'request_uuid': payload['request_uuid']
                        }
                        response.currency = payload['currency'];
                        res.json(response)
                    } else {
                        walletModel.getTransactionByTransactionUUID(payload).then(async (prev_tran) => {
                            if (prev_tran.length) {
                                let response = {
                                    'user': payload['user'],
                                    'status': 'RS_ERROR_DUPLICATE_TRANSACTION',
                                    'request_uuid': payload['request_uuid']
                                }
                                response.currency = payload['currency'];
                                res.json(response)
                            } else {
                                await userModel.updateUserProfit(payload).then((data) => { console.log(data); }, (err) => { console.log(err); });
                                getBalance(decoded, payload).then(async (responsed) => {

                                    let tran_fields = " (amount, balance, request_uuid, transaction_uuid, user, rolled_back, transaction_type, supplier_user, supplier_transaction_id )";
                                    let tran_values = ` ( ${payload.amount}, ${responsed.balance}, '${payload.request_uuid}', '${payload.transaction_uuid}', '${payload.user}', 'N', 'credit', '${payload.supplier_user}', '${payload.supplier_transaction_id}' )`;
                                    await walletModel.insertTransactionFieldValues(tran_fields, tran_values);
                                    responsed.currency = payload['currency'];

                                    res.json(responsed);
                                });
                            }
                        })
                    }
                });


                
            } catch (err) {
                let response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_UNKNOWN',
                    'request_uuid': payload['request_uuid']
                }

                let data = {
                    'user': payload['user'],
                    'token': payload['token'],
                    'date_time': 'NOW()',
                    'error': JSON.stringify(err.stack)
                }

                // db['casino_errors'].insert_one(data)
                await errorModel.insertErrorObject(data);

                res.json(response)
            }
        } else {
            let response = {
                'user': payload['user'],
                'status': 'RS_ERROR_INVALID_SIGNATURE',
                'request_uuid': payload['request_uuid']
            }
            res.json(response);
        }
    }
]


exports.rollback = [
    getAuth,
    async (req, res) => {
        let date_time = new Date();
        let headers = req.headers;
        let payload = req.body;
        let data = JSON.stringify(payload);
        console.log( data);
        let verification = verifySignature(data, headers['casino-signature']);
        let decoded;
        jwt.verify(payload.token, secretKey, (err, decod) => {
            if (err) {
                // console.log(err);
                if (err.message == "jwt expired") {
                    let response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_TOKEN_EXPIRED',
                        'request_uuid': payload['request_uuid']
                    }
                    response.currency = payload['currency'];
                    res.json(response);
                } else {
                    let response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_INVALID_TOKEN',
                        'request_uuid': payload['request_uuid']
                    }
                    response.currency = payload['currency'];
                    res.json(response);
                }
            } else {
                decoded = decod;
            }
        });

        if (verification) {

            walletModel.getTransactionByReqUUID(payload).then(async (prev_req) => {
                if (prev_req.length) {
                    let response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_DUPLICATE_TRANSACTION',
                        'request_uuid': payload['request_uuid']
                    }
                    response.currency = payload['currency'];
                    res.json(response)
                } else {

                    walletModel.getTransactionByTransactionUUIDRollback(payload).then(async (prev_transaction) => {
                        if (prev_transaction.length) {
                            console.log("Prevkjkjkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", prev_transaction);
                            prev_transaction = prev_transaction[0];
                            await walletModel.updateTransactionStatusByTransactionUUID(payload);
                            await walletModel.subtractBalanceWithCurrent(prev_transaction['amount'], payload['user']).then((data) => {
                                console.log(data);
                            }, (err) => {
                                console.log(err);
                            });
                            let responsed = await getBalance(decoded, payload);
                            let tran_fields = " ( balance, request_uuid, transaction_uuid, user, rolled_back, transaction_type )";
                            let tran_values = ` (  ${responsed.balance}, '${payload.request_uuid}', '${payload.transaction_uuid}', '${payload.user}', 'Y', 'rollback')`;
                            await walletModel.insertTransactionFieldValues(tran_fields, tran_values);
                            console.log("values", tran_values);
                            responsed.currency = payload['currency'];
                            res.json(responsed);
                        } else {
                            let response = {
                                'user': payload['user'],
                                'status': 'RS_OK',
                                'request_uuid': payload['transaction_uuid']
                            }
                            response.currency = payload['currency'];

                            res.json(response);
                        }

                    });

                }
            });

            // prev_transaction = db['transactions'].find_one({ 'transaction_uuid': payload['transaction_uuid'] })

        } else {
            let response = {
                'user': payload['user'],
                'status': 'RS_ERROR_INVALID_SIGNATURE',
                'request_uuid': payload['request_uuid']
            }
            response.currency = payload['currency'];


            res.json(response);
        }

        
    }
]

function verify_signature(data, sign) {
    const pubkey = fs.readFileSync(public_keyPath, "utf8");
    let verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    return verifier.verify(pubkey, sign, 'base64');

}

function verifySignature(data, sign) {

    const pubkey = fs.readFileSync(public_keyPath, "utf8");
    let verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    return verifier.verify(pubkey, sign, 'base64');

}

function getBalance(jwt_decoded, payload) {
    return new Promise(async (resolve, reject) => {
        await walletModel.getWalletByUser(jwt_decoded).then(async (user) => {
            // console.log("user", user);

            await walletModel.getUserExposure(jwt_decoded).then((userExposure) => {
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
                    console.log(resp);
                    resolve(resp);
                } else {
                    resolve({ exposure: 0 });
                }
            }, (err) => {
                console.log("err1", err);
                resolve({ exposure: 0 });
            }).catch((err) => {
                console.log("err2", err);
                resolve({ exposure: 0 });
            })

        })
    })
}
