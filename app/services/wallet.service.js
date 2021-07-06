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

let public_keyPath = path.resolve("./app/services/ProductionPublicKey.pem");
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
        payload["user_id"] = payload["user"];
        let verification = verify_signature(payload, headers);
        console.log(verification);
        if (verification) {
            try {
                // let token = db['tokens'].find_one({'username': payload['user'], 'token': payload['token']}, {'expired': 1, '_id': 0})
                walletModel.getWalletByUserToken(payload).then((token) => {
                    if (!token) {
                        let response = {
                            'user': payload['user_id'],
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
                                        'user': payload['user_id'],
                                        'status': 'RS_ERROR_TOKEN_EXPIRED',
                                        'request_uuid': payload['request_uuid']
                                    }
                                    res.json(response);
                                } else {
                                    let response = {
                                        'user': payload['user_id'],
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
                                            walletModel.transactionExists(payload["request_uuid"]).then((transaction)=>{
                                                console.log(transaction);
                                                let resp = {
                                                    'user': payload['user_id'],
                                                    'status': 'RS_OK',
                                                    'request_uuid': payload['request_uuid'],
                                                    'balance': available_balance * 100000,
                                                    'currency': transaction[0]?.currency || payload.currency || "NOT_FOUND"
                                                }
                                                res.json(resp);
                                            });
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
                    'date_time': 'NOW()',
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
    async (req, res) => {
        let date_time = new Date()
        let headers = req.headers['casino-signature']
        let payload = req.body;
        payload["user_id"] = payload["user"];
        let verification = verify_signature(payload, headers);

        if (verification) {
            try {
                let jwt_decoded;
                jwt.verify(payload.token, secretKey, (err, decoded) => {
                    if (err) {
                        // console.log(err);
                        if (err.message == "jwt expired") {
                            let response = {
                                'user': payload['user_id'],
                                'status': 'RS_ERROR_TOKEN_EXPIRED',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        } else {
                            let response = {
                                'user': payload['user_id'],
                                'status': 'RS_ERROR_INVALID_TOKEN',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        }
                    } else {
                        if (payload['currency'] != 'HKD') {
                            response = {
                                'user': payload['user_id'],
                                'status': 'RS_ERROR_WRONG_CURRENCY',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        }

                        if (payload['amount'] < 0) {
                            response = {
                                'user': payload['user_id'],
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
                            'user': payload['user_id'],
                            'status': 'RS_ERROR_DUPLICATE_REQUEST',
                            'request_uuid': payload['request_uuid']
                        }
                        response.currency = payload['currency'];
                        res.json(response)
                    } else {
                        walletModel.getTransactionByTransactionUUID(payload).then((prev_tran) => {
                            if (prev_tran.length > 0) {
                                let response = {
                                    'user': payload['user_id'],
                                    'status': 'RS_ERROR_DUPLICATE_TRANSACTION',
                                    'request_uuid': payload['request_uuid']
                                }
                                response.currency = payload['currency'];
                                res.json(response)
                            } else {
                                getBalance(jwt_decoded, payload).then(async (responsed) => {

                                    console.log("jhhhsvjvsdjvsjv", responsed)

                                    await userModel.updateUserCasinoProfit(payload);


                                    let tran_fields = " (amount, transactionId, roundId, betTime, status, clientId, creditId, winAmount )";
                                    let tran_values = ` ( ${payload.amount}, '${payload.transaction_uuid}',  '${payload.roundId}' ,  NOW() ,  '${payload.status}',  '${payload.user_id}', '${payload.creditId}', '${payload.winAmount || 0}')`;
                                    await walletModel.insertTransactionCbet(tran_fields, tran_values).then(() => { }, (err) => {
                                        if (err.message.includes("Duplicate entry")) {
                                            let response = {
                                                'user': payload['user_id'],
                                                'status': 'RS_ERROR_DUPLICATE_CREDITID',
                                                'request_uuid': payload['request_uuid']
                                            }
                                            response.currency = payload['currency'];
                                            res.json(response)
                                        }
                                    });

                                    tran_fields = " (balance, request_uuid, transaction_uuid, user_id, rolled_back, transaction_type, supplier_user, supplier_transaction_id )";
                                    tran_values = ` ( ${responsed.balance}, '${payload['request_uuid']}', '${payload.transaction_uuid}', '${payload.user_id}', 'N', 'debit', '${payload.supplier_user}', '${payload.supplier_transaction_id}' )`;
                                    await walletModel.insertTransactionFieldValues(tran_fields, tran_values);
                                    responsed.currency = payload['currency'];

                                    res.json(responsed);

                                    // res.json(response);
                                });
                            }
                        })
                    }
                })
                // prev_response = db['transactions'].find_one({ 'request_uuid': payload['request_uuid'] });


                // prev_transaction = db['transactions'].find_one({ 'transaction_uuid': payload['transaction_uuid'] })



                // let response = await getBalance(jwt_decoded, payload);

                // token = db['tokens'].find_one({ 'username': payload['user'], 'token': payload['token'] }, { 'expired': 1, '_id': 0 })

                // walletModel.getTransactionByTransactionUUID(payload).then((token) => {

                //     if (!token.length) {
                //         response = {
                //             'user': payload['user_id'],
                //             'status': 'RS_ERROR_INVALID_TOKEN',
                //             'request_uuid': payload['request_uuid']
                //         }
                //         res.json(response)
                //     }
                //     if (token[0].token['expired'] == 'Y') {
                //         response = {
                //             'user': payload['user_id'],
                //             'status': 'RS_ERROR_TOKEN_EXPIRED',
                //             'request_uuid': payload['request_uuid']
                //         }
                //         res.json(response)
                //     }

                //     // required = {
                //     //     'user': 1,
                //     //     'user_status': 1,
                //     //     'bet_status': 1,
                //     //     'balance': 1,
                //     //     'casino_profit_loss': 1
                //     // }

                //     // user = db['users'].find_one({ 'username': payload['user'] }, required)

                //     userModel.getUserByUsername(payload['user_id']).then((user) => {
                //         if (user.length) {

                //             user = user[0];
                //             if (user['user_status'] == 'N' || user['bet_status'] == 'N') {
                //                 response = {
                //                     'user': payload['user_id'],
                //                     'status': 'RS_ERROR_USER_DISABLED',
                //                     'request_uuid': payload['request_uuid']
                //                 }
                //                 res.json(response)
                //             }

                //             // available_balance = requests.post('http://endpoint/user_expo/', json = { 'user_id': str(user['_id']) }).json()['user_balance']

                //             walletModel.getUserExposure(decoded).then(async (available_balance) => {
                //                 console.log("available_balance", available_balance);
                //                 if (available_balance.length) {
                //                     available_balance = available_balance[0];

                //                     if ((available_balance * 100000) >= payload['amount']) {
                //                         let balance = (available_balance * 100000) - payload['amount']
                //                         let profit_loss = user['casino_profit_loss'] - parseInt(payload['amount'] / 100000)

                //                         try {
                //                             let amount = parseInt(payload['amount'] / 100000)

                //                             payload['user_id'] = user['_id']
                //                             payload['transaction_time'] = date_time
                //                             payload['rolled_back'] = 'N'
                //                             payload['transaction_type'] = 'debit'
                //                             payload['amount'] = amount
                //                             payload['balance'] = parseInt(balance / 100000)

                //                             // _id = db['transactions'].insert_one(payload).inserted_id
                //                             // db['users'].update_one({ 'username': payload['user'] }, { '$set': { 'casino_profit_loss': profit_loss } })
                //                             await walletModel.insertTransaction(payload);

                //                             let response = {
                //                                 'user': payload['user_id'],
                //                                 'status': 'RS_OK',
                //                                 'request_uuid': payload['request_uuid'],
                //                                 'balance': balance
                //                             }

                //                             res.json(response)
                //                         } catch (err) {
                //                             let response = {
                //                                 'user': payload['user_id'],
                //                                 'status': 'RS_ERROR_UNKNOWN',
                //                                 'request_uuid': payload['request_uuid']
                //                             }

                //                             let data = {
                //                                 'user': payload['user_id'],
                //                                 'token': payload['token'],
                //                                 'date_time': new Date(),
                //                                 'error': err.stack
                //                             }

                //                             // db['casino_errors'].insert_one(data)
                //                             await errorModel.insertErrorObject(data);

                //                             res.json(response)
                //                         }
                //                     } else {
                //                         let response = {
                //                             'user': payload['user_id'],
                //                             'status': 'RS_ERROR_NOT_ENOUGH_MONEY',
                //                             'request_uuid': payload['request_uuid'],
                //                             'balance': available_balance * 100000
                //                         }

                //                         res.json(response)
                //                     }
                //                 } else {

                //                 }
                //             }, (err) => {
                //                 console.log("err1", err);
                //             }).catch((err) => {
                //                 console.log("err2", err);
                //             })
                //         }
                //     })
                // });



            } catch (err) {
                console.log(err);
                let response = {
                    'user': payload['user_id'],
                    'status': 'RS_ERROR_UNKNOWN',
                    'request_uuid': payload['request_uuid']
                }
                response.currency = payload['currency'];
                let data = {
                    'user': payload['user_id'],
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
                'user': payload['user_id'],
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
        let headers = req.headers;
        let payload = req.body;
        payload["user_id"] = payload["user"];
        let verification = verify_signature(payload, headers['casino-signature']);

        if (verification) {
            try {
                let decoded;
                jwt.verify(payload.token, secretKey, (err, decod) => {
                    if (err) {
                        // console.log(err);
                        if (err.message == "jwt expired") {
                            let response = {
                                'user': payload['user_id'],
                                'status': 'RS_ERROR_TOKEN_EXPIRED',
                                'request_uuid': payload['request_uuid']
                            }
                            response.currency = payload['currency'];
                            res.json(response);
                        } else {
                            let response = {
                                'user': payload['user_id'],
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
                        'user': payload['user_id'],
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
                            'user': payload['user_id'],
                            'status': 'RS_ERROR_DUPLICATE_REQUEST',
                            'request_uuid': payload['request_uuid']
                        }
                        response.currency = payload['currency'];
                        res.json(response)
                    } else {
                        walletModel.getTransactionByTransactionUUID(payload).then(async (prev_tran) => {
                            if (prev_tran.length) {
                                let response = {
                                    'user': payload['user_id'],
                                    'status': 'RS_ERROR_DUPLICATE_TRANSACTION',
                                    'request_uuid': payload['request_uuid']
                                }
                                response.currency = payload['currency'];
                                res.json(response)
                            } else {
                                getBalance(decoded, payload).then(async (responsed) => {
                                    await userModel.updateUserProfit(payload);

                                    let tran_fields = " (balance, request_uuid, transaction_uuid, user_id, rolled_back, transaction_type, supplier_user, supplier_transaction_id )";
                                    let tran_values = ` ( ${responsed.balance}, '${payload.request_uuid}', '${payload.transaction_uuid}', '${payload.user_id}', 'N', 'credit', '${payload.supplier_user}', '${payload.supplier_transaction_id}' )`;
                                    await walletModel.insertTransactionFieldValues(tran_fields, tran_values);
                                    responsed.currency = payload['currency'];

                                    res.json(responsed);
                                });
                            }
                        })
                    }
                });


                // token = db['tokens'].find_one({ 'username': payload['user'], 'token': payload['token'] }, { 'expired': 1, '_id': 0 })
                // walletModel.getTokenByUserToken(payload).then((token) => {
                //     if (!token.length) {
                //         let response = {
                //             'user': payload['user'],
                //             'status': 'RS_ERROR_INVALID_TOKEN',
                //             'request_uuid': payload['request_uuid']
                //         }
                //         res.json(response);
                //     }

                //     // transaction_exist = db['transactions'].find_one({ 'transaction_uuid': payload['reference_transaction_uuid'] })
                //     walletModel.transactionExists(payload).then((transaction_exist) => {

                //         if (!transaction_exist.length) {
                //             let response = {
                //                 'user': payload['user'],
                //                 'status': 'RS_ERROR_TRANSACTION_DOES_NOT_EXIST',
                //                 'request_uuid': payload['request_uuid']
                //             }
                //             res.json(response)
                //         }

                //         // required = {
                //         //     'user': 1,
                //         //     'balance': 1,
                //         //     'casino_profit_loss': 1
                //         // }
                //         // user = db['users'].find_one({ 'username': payload['user'] }, required)
                //         userModel.getUserByUsername(payload).then((user) => {
                //             if (user.length) {
                //                 user = user[0];

                //                 // available_balance = requests.post('http://endpoint/user_expo/', json = { 'user_id': str(user['_id']) }).json()['user_balance']


                //                         walletModel.getUserExposure(decoded).then(async (available_balance) => {

                //                             if (available_balance.length) {
                //                                 available_balance = available_balance[0];

                //                                 let balance = (available_balance * 100000) + payload['amount'];
                //                                 let profit_loss = user['casino_profit_loss'] + parseInt(payload['amount'] / 100000);

                //                                 try {
                //                                     let amount = parseInt(payload['amount'] / 100000)

                //                                     payload['user_id'] = user['_id'];
                //                                     payload['transaction_time'] = date_time;
                //                                     payload['rolled_back'] = 'N';
                //                                     payload['transaction_type'] = 'credit';
                //                                     payload['amount'] = amount;
                //                                     payload['balance'] = parseInt(balance / 100000);

                //                                     // _id = db['transactions'].insert_one(payload).inserted_id
                //                                     await walletModel.insertTransaction(payload);

                //                                     // db['users'].update_one({ 'username': payload['user'] }, { '$set': { 'casino_profit_loss': profit_loss } })

                //                                     await userModel.updateUserCasinoProfit(payload['user'], profit_loss);


                //                                     let response = {
                //                                         'user': payload['user'],
                //                                         'status': 'RS_OK',
                //                                         'request_uuid': payload['request_uuid'],
                //                                         'balance': balance
                //                                     }
                //                                     res.json(response)
                //                                 } catch (err) {
                //                                     let response = {
                //                                         'user': payload['user'],
                //                                         'status': 'RS_ERROR_UNKNOWN',
                //                                         'request_uuid': payload['request_uuid']
                //                                     }

                //                                     let data = {
                //                                         'user': payload['user'],
                //                                         'token': payload['token'],
                //                                         'date_time': new Date(),
                //                                         'error': err.stack
                //                                     }

                //                                     // db['casino_errors'].insert_one(data)
                //                                     await errorModel.insertErrorObject(data);

                //                                     res.json(response)
                //                                 }
                //                             }
                //                         });


                //             }
                //         })
                //     });
                // });
            } catch (err) {
                let response = {
                    'user': payload['user_id'],
                    'status': 'RS_ERROR_UNKNOWN',
                    'request_uuid': payload['request_uuid']
                }

                let data = {
                    'user': payload['user_id'],
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
                'user': payload['user_id'],
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
        payload["user_id"] = payload["user"];
        let verification = verify_signature(payload, headers['casino-signature']);
        let decoded;
        jwt.verify(payload.token, secretKey, (err, decod) => {
            if (err) {
                // console.log(err);
                if (err.message == "jwt expired") {
                    let response = {
                        'user': payload['user_id'],
                        'status': 'RS_ERROR_TOKEN_EXPIRED',
                        'request_uuid': payload['request_uuid']
                    }
                    response.currency = payload['currency'];
                    res.json(response);
                } else {
                    let response = {
                        'user': payload['user_id'],
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
                        'user': payload['user_id'],
                        'status': 'RS_ERROR_DUPLICATE_TRANSACTION',
                        'request_uuid': payload['request_uuid']
                    }
                    response.currency = payload['currency'];
                    res.json(response)
                } else {
                    getBalance(decoded, payload).then(async (responsed) => {

                        let tran_fields = " (balance, request_uuid, transaction_uuid, user_id, rolled_back, transaction_type, supplier_user, supplier_transaction_id )";
                        let tran_values = ` ( ${responsed.balance}, '${payload.request_uuid}', '${payload.transaction_uuid}', '${payload.user_id}', 'Y', 'rollback', '${payload.supplier_user}', '${payload.supplier_transaction_id}' )`;
                        console.log("values", tran_values);
                        await walletModel.insertTransactionFieldValues(tran_fields, tran_values);

                        walletModel.getTransactionByTransactionUUIDRollback(payload).then(async (prev_transaction) => {
                            if (prev_transaction.length) {
                                prev_transaction = prev_transaction[0];
                                await walletModel.updateTransactionStatusByTransactionUUID(payload);
                                await walletModel.subtractBalanceWithCurrent(prev_transaction['amount']).then((data) => {
                                    console.log(data);
                                }, (err) => {
                                    console.log(err);
                                });
                            } else {
                                let response = {
                                    'user': payload['user_id'],
                                    'status': 'RS_OK',
                                    'request_uuid': payload['transaction_uuid']
                                }
                                response.currency = payload['currency'];

                                res.json(response);
                            }
                        });
                        responsed.currency = payload['currency'];
                        res.json(responsed);
                    });
                }
            });

            // prev_transaction = db['transactions'].find_one({ 'transaction_uuid': payload['transaction_uuid'] })

        } else {
            let response = {
                'user': payload['user_id'],
                'status': 'RS_ERROR_INVALID_SIGNATURE',
                'request_uuid': payload['request_uuid']
            }
            response.currency = payload['currency'];


            res.json(response);
        }

        /*if verification:
        try:
            prev_response = db['transactions'].find_one({'request_uuid': payload['request_uuid']})

            if prev_response is None:
                prev_transaction = db['transactions'].find_one({'transaction_uuid': payload['transaction_uuid']})

                if prev_transaction is not None:

                    if payload['round'] == prev_transaction['round'] and payload['reference_transaction_uuid'] == prev_transaction['reference_transaction_uuid']:
                        response = {
                            'user': payload['user'],
                            'status': 'RS_OK',
                            'request_uuid': payload['request_uuid'],
                            'balance': prev_transaction['balance'] * 100000
                        }

                        return jsonify(response)
                    else:
                        response = {
                            'user': payload['user'],
                            'status': 'RS_ERROR_DUPLICATE_TRANSACTION',
                            'request_uuid': payload['request_uuid']
                        }

                    return jsonify(response)

                token = db['tokens'].find_one({'username': payload['user'], 'token': payload['token']}, {'expired': 1, '_id': 0})

                if token is None:
                    response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_INVALID_TOKEN',
                        'request_uuid': payload['request_uuid']
                    }

                    return jsonify(response)

                required = {
                    'user': 1,
                    'balance': 1,
                    'casino_profit_loss': 1
                }

                user = db['users'].find_one({'username': payload['user']}, required)

                available_balance = requests.post('http://endpoint/user_expo/', json={'user_id': str(user['_id'])}).json()['user_available_balance']

                transaction = db['transactions'].find_one({'transaction_uuid': payload['reference_transaction_uuid']})

                if transaction is None or transaction['rolled_back'] == 'Y':
                    response = {
                        'user': payload['user'],
                        'status': 'RS_OK',
                        'request_uuid': payload['request_uuid'],
                        'balance': available_balance * 100000
                    }

                    return jsonify(response)

                if transaction['transaction_type'] == 'credit':
                    balance = (available_balance * 100000) - (transaction['amount'] * 100000)
                    profit_loss = user['casino_profit_loss'] - transaction['amount']
                    amount = - transaction['amount']
                    trans_type = 'withdrawal'
                else:
                    balance = (available_balance * 100000) + (transaction['amount'] * 100000)
                    profit_loss = user['casino_profit_loss'] + transaction['amount']
                    amount = transaction['amount']
                    trans_type = 'deposit'

                try:
                    db['transactions'].update_one({'transaction_uuid': payload['reference_transaction_uuid']}, {'$set': {'rolled_back': 'Y'}})

                    payload['user_id'] = user['_id']
                    payload['transaction_time'] = date_time
                    payload['rolled_back'] = 'N'
                    payload['transaction_type'] = 'rollback'
                    payload['balance'] = int(balance / 100000)

                    _id = db['transactions'].insert_one(payload).inserted_id
                    db['users'].update_one({'username': payload['user']}, {'$set': {'casino_profit_loss': profit_loss}})


                    response = {
                        'user': payload['user'],
                        'status': 'RS_OK',
                        'request_uuid': payload['request_uuid'],
                        'balance': balance
                    }

                    return (response)
                except:
                    response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_UNKNOWN',
                        'request_uuid': payload['request_uuid']
                    }

                    data = {
                        'user': payload['user'],
                        'token': payload['token'],
                        'date_time': datetime.utcnow(),
                        'error': str(traceback.format_exc())
                    }

                    db['casino_errors'].insert_one(data)

                    return (response)
            else:
                response = {
                    'user': payload['user'],
                    'status': 'RS_OK',
                    'request_uuid': payload['request_uuid'],
                    'balance': prev_response['balance'] * 100000
                }

                return jsonify(response)
        except:
            response = {
                'user': payload['user'],
                'status': 'RS_ERROR_UNKNOWN',
                'request_uuid': payload['request_uuid']
            }

            data = {
                'user': payload['user'],
                'token': payload['token'],
                'date_time': datetime.utcnow(),
                'error': str(traceback.format_exc())
            }

            db['casino_errors'].insert_one(data)

            return jsonify(response)
    else:
        response = {
            'user': payload['user'],
            'status': 'RS_ERROR_INVALID_SIGNATURE',
            'request_uuid': payload['request_uuid']
        }

        return jsonify(response) */
    }
]

function verify_signature(data, sign) {

    const pubkey = fs.readFileSync(public_keyPath);
    verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(data));
    // return verifier.verify(pubkey, sign,'base64');
    return true;

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
                        'user': payload['user_id'],
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
// function verify_signature(data, signature) {
//     try {
//         // const decryptedData =JSON.parse(private_key.decrypt(signature,"utf8"))
//         // console.log("decoded",decryptedData);
//         // console.log("data",data)
//         const isVerified = crypto.verify(
//             "sha256",
//             Buffer.from(JSON.stringify({ user_id: data.user_id, token: data.token })),
//             {
//                 key: pkey,
//                 padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
//             },
//             Buffer.from(signature, "base64")
//         )
//         // if (decryptedData.token == data.token && decryptedData.user_id == data.user_id) {
//         //     return true;
//         // } else {
//         //     return false;
//         // }
//         return isVerified;
//     }
//     catch (err) {
//         console.log(err);
//         return false;
//     }
// }