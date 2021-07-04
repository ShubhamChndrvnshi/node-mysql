var walletModel = require("../models/wallet.model.js");
const errorModel = require("../models/error.model");
const getAuth = require("../../config/getAuth");
const NodeRSA = require('node-rsa');
const axios = require('axios');
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

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

// username flied not found, so using id in place of username
exports.balance = [
    getAuth,
    (req, res) => {
        let headers = req.headers['casino-signature']
        let payload = req.body;
        // const decryptedData = crypto.privateDecrypt(
        //     {
        //         key: key,
        //         // In order to decrypt the data, we need to specify the
        //         // same hashing function and padding scheme that we used to
        //         // encrypt the data in the previous step
        //         padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        //         oaepHash: "sha256",
        //     },
        //     headers
        // );
        // console.log("headers",headers);

        // console.log("decryptedData",decryptedData);

        let verification = true || verify_signature(payload, headers, public_key);
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
                errorModel.insertError(data).then(()=>{}).catch(()=>{});
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

function verify_signature(data, signature, key) {
    try {
        const decryptedData = crypto.privateDecrypt(
            {
                key: key,
                // In order to decrypt the data, we need to specify the
                // same hashing function and padding scheme that we used to
                // encrypt the data in the previous step
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            encryptedData
        )
        let signer = new NodeRSA(key, "pkcs1");
        let digest = new NodeRSA(data, "sha256");
        console.log("signer", signer);
        console.log("digest", digest);
        // digest.update(data)
        if (signer.verify(digest, Buffer.from(signature, 'base64'))) {
            return true
        }
        return false;
    }
    catch (err) {
        return false;
    }
}