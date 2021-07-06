const db = require('../../config/database');
const dbFunc = require('../../config/db-function');

const walletModel = {
    getWalletByUserByPassword: getWalletByUserByPassword,
    addWallet: addWallet,
    updateUserToken: updateUserToken,
    subtractBalanceWithCurrent: subtractBalanceWithCurrent,
    getWalletByUser: getWalletByUser,
    getWalletByUserToken: getWalletByUserToken,
    getUserExposure: getUserExposure,
    getTransactionByReqUUID: getTransactionByReqUUID,
    getTransactionByTransactionUUID: getTransactionByTransactionUUID,
    getTokenByUserToken: getTokenByUserToken,
    upsertUserToken: upsertUserToken,
    expireUserToken: expireUserToken,
    insertTransaction: insertTransaction,
    transactionExists: transactionExists,
    getWalletByUserByToken: getWalletByUserByToken,
    getWalletByUserByPass: getWalletByUserByPass,
    getUserCurrLimit: getUserCurrLimit,
    getCreditTransactionByTransactionUUID: getCreditTransactionByTransactionUUID,
    insertTransactionFieldValues: insertTransactionFieldValues,
    insertTransactionCbet: insertTransactionCbet,
    getToken: getToken,
    updateTransactionStatusByTransactionUUID: updateTransactionStatusByTransactionUUID,
    getTransactionByTransactionUUIDRollback, getTransactionByTransactionUUIDRollback,
}
/*********************************** */
function insertTransactionFieldValues(fields, values) {
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO transactions ${fields} VALUES ${values}`, (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
/********************************* */
function insertTransactionCbet(fields, values) {
    return new Promise((resolve, reject) => {
        db.query(`INSERT INTO cbet ${fields} VALUES ${values}`, (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}

function transactionExists(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM transactions WHERE transaction_uuid ='" + payload['transaction_uuid'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}

function insertTransaction(payload) {
    let fields = "";
    let values = "";
    Object.entries(payload).forEach(
        ([key, value]) => {
            if (typeof (value) != "number") {
                value = `'${value}'`;
            }
            fields = fields + key + ","
            values = values + value + ","
        }
    );
    fields = fields.slice(0, -1);
    values = values.slice(0, -1);
    return new Promise((resolve, reject) => {
        db.query(`INSERT IGNORE INTO transactions (${fields}) VALUES (${values})`, (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    })
}

/*************************************** */
function expireUserToken(token) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE tokens set expired='Y' WHERE token='" + token + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    })
}

/******************************************** */
function upsertUserToken(payload) {
    let fields = "";
    let values = "";
    Object.entries(payload).forEach(
        ([key, value]) => {
            if (typeof (value) != "number") {
                value = `'${value}'`;
            }
            fields = fields + key + ","
            values = values + value + ","
        }
    );
    fields = fields.slice(0, -1);
    values = values.slice(0, -1);
    return new Promise((resolve, reject) => {
        db.query(`INSERT IGNORE INTO tokens (${fields}) VALUES (${values})`, (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    })
}


function getTokenByUserToken(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Tokens WHERE username ='" + payload['user'] + "' AND token = '" + payload['token'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}

/********************************************** */
function getToken(token) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM Tokens WHERE token = '" + token + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
/*************************** */
function getTransactionByTransactionUUID(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM transactions WHERE transaction_uuid = '" + payload['transaction_uuid'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
/******************************** */
function getTransactionByTransactionUUIDRollback(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM transactions WHERE transaction_uuid = '" + payload['transaction_uuid'] + "' AND bet_status <> 'U'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}

/************************************ */
function updateTransactionStatusByTransactionUUID(payload) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE transactions set bet_status = 'U' where transaction_uuid ='" + payload['transaction_uuid'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}

function getCreditTransactionByTransactionUUID(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM transactions WHERE transaction_uuid = '" + payload['transaction_uuid'] + "' AND transaction_type = 'credit'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
/************************ */
function getTransactionByReqUUID(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM transactions WHERE request_uuid = '" + payload['request_uuid'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
function getWalletByUserByToken(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM client WHERE id = '" + payload['user_id'] + "' AND token = '" + payload['token'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}

/**************************************** */
function getWalletByUserByPass(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM client WHERE id = '" + payload['user_id'] + "' AND token = '" + payload['password'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
/************************************** */

function getWalletByUserByPassword(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM client WHERE id = '" + payload['user_id'] + "' AND password = '" + payload['password'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                // console.log(fields)
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
/*********************************** */
function getWalletByUser(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM client WHERE id = '" + payload['user_id'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
/**************************************** */
function getUserExposure(payload) {
    return new Promise((resolve, reject) => {
        let id = payload['user_id'] || payload['_id']
        let query = "SELECT IFNULL(SUM(exposure),0) AS exposure from exposure Where clientId ='" + id + "' AND status = 1";
        // console.log(query);
        db.query(query, (error, rows, fields) => {
            if (!!error) {
                // console.log(error);
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}


function getUserCurrLimit(payload) {
    return new Promise((resolve, reject) => {
        let id = payload['user_id'] || payload['_id']
        let query = "Select IFNULL(curr_limit,0) from client where id= '" + id + "'";
        // console.log(query);
        db.query(query, (error, rows, fields) => {
            if (!!error) {
                // console.log(error);
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}
/******************************** */
function getWalletByUserToken(payload) {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM client WHERE id ='" + payload['user_id'] + "' AND token = '" + payload['token'] + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}

function addWallet(user) {
    return new Promise((resolve, reject) => {
        db.query("INSERT INTO client(name,age,state,country)VALUES('" + user.name + "','" + user.age + "','" + user.state + "','" + user.country + "')", (error, rows, fields) => {
            if (error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}

/********************************************** */
function updateUserToken(id, token) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE Tokens set token='" + token + "' WHERE username='" + id + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    })
}

/*************************************** */
function subtractBalanceWithCurrent(amount, id) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE client set curr_limit = curr_limit - " + amount + " where id='" + id + "'", (error, rows, fields) => {
            if (!!error) {
                dbFunc.connectionRelease;
                reject(error);
            } else {
                dbFunc.connectionRelease;
                resolve(rows);
            }
        });
    });
}


module.exports = walletModel;

