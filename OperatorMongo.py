from Crypto.Signature import PKCS1_v1_5
from Crypto.PublicKey import RSA
from Crypto.Hash import SHA256
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import traceback
import requests
import pymongo
import base64
import json
import jwt

app = Flask(__name__)
CORS(app)

# Add Mongo or other DB connection , add db name
conn = pymongo.MongoClient('mongodb+srv://User:pass@mongodb.net/heera?retryWrites=true&w=majority')
db = conn['Dbname']

with open('/path/ProductionPublicKey.txt', 'r') as file:
    public_key = RSA.importKey(file.read())

with open('/path/ProductionPrivateKey.txt', 'r') as file:
    private_key = RSA.importKey(file.read())

with open('/path/SecretKey.txt', 'r') as file:
    secret_key = file.read()


def sign_data(data, key):
    digest = SHA256.new()
    digest.update(json.dumps(data).encode('utf-8'))
    signer = PKCS1_v1_5.new(key)
    sig = signer.sign(digest)
    return sig


def verify_signature(data, signature, key):
    try:
        signer = PKCS1_v1_5.new(key)
        digest = SHA256.new()
        digest.update(data)
        if signer.verify(digest, base64.b64decode(signature)):
            return True
        return False
    except:
        return False


@app.route('/wallet/balance', methods=['POST'])
def get_balance():
    headers = request.headers['Casino-Signature']
    payload = request.get_json()
    verification = verify_signature(request.data, headers, public_key)

    if verification:
        try:
            token = db['tokens'].find_one({'username': payload['user'], 'token': payload['token']}, {'expired': 1, '_id': 0})

            if token is None:
                response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_INVALID_TOKEN',
                    'request_uuid': payload['request_uuid']
                }

                return jsonify(response)

            if token['expired'] == 'Y':
                response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_TOKEN_EXPIRED',
                    'request_uuid': payload['request_uuid']
                }

                return jsonify(response)

            required = {
                'username': 1,
                'balance': 1,
                'casino_profit_loss': 1
            }

            user = db['users'].find_one({'username': payload['user']}, required)
#Add user exposure endpoint or db section

            available_balance = requests.post('http://endpoint/user_expo/', json={'user_id': str(user['_id'])}).json()['user_balance']

            response = {
                'user': payload['user'],
                'status': 'RS_OK',
                'request_uuid': payload['request_uuid'],
                'balance': available_balance * 100000
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

        return jsonify(response)


@app.route('/wallet/bet', methods=['POST'])
def debit():
    date_time = datetime.utcnow()
    headers = request.headers['Casino-Signature']
    payload = request.get_json()
    verification = verify_signature(request.data, headers, public_key)

    if verification:
        try:
            
            if payload['currency'] != 'HKD':
                response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_WRONG_CURRENCY',
                    'request_uuid': payload['request_uuid']
                }

                return jsonify(response)

            if payload['amount'] < 0:
                response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_WRONG_TYPES',
                    'request_uuid': payload['request_uuid']
                }

                return jsonify(response)

            prev_response = db['transactions'].find_one({'request_uuid': payload['request_uuid']})

            if prev_response is None:
                prev_transaction = db['transactions'].find_one({'transaction_uuid': payload['transaction_uuid']})

                if prev_transaction is not None:

                    if payload['round'] == prev_transaction['round'] and payload['amount'] == (prev_transaction['amount'] * 100000):
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

                if token['expired'] == 'Y':
                    response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_TOKEN_EXPIRED',
                        'request_uuid': payload['request_uuid']
                    }

                    return jsonify(response)

                required = {
                    'user': 1,
                    'user_status': 1,
                    'bet_status': 1,
                    'balance': 1,
                    'casino_profit_loss': 1
                }

                user = db['users'].find_one({'username': payload['user']}, required)

                if user['user_status'] == 'N' or user['bet_status'] == 'N':
                    response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_USER_DISABLED',
                        'request_uuid': payload['request_uuid']
                    }

                    return jsonify(response)
#Add user exposure or endpoint

                available_balance = requests.post('http://endpoint/user_expo/', json={'user_id': str(user['_id'])}).json()['user_balance']

                if (available_balance * 100000) >= payload['amount']:
                    balance = (available_balance * 100000) - payload['amount']
                    profit_loss = user['casino_profit_loss'] - int(payload['amount'] / 100000)

                    try:
                        amount = int(payload['amount'] / 100000)

                        payload['user_id'] = user['_id']
                        payload['transaction_time'] = date_time
                        payload['rolled_back'] = 'N'
                        payload['transaction_type'] = 'debit'
                        payload['amount'] = amount
                        payload['balance'] = int(balance / 100000)

                        _id = db['transactions'].insert_one(payload).inserted_id
                        db['users'].update_one({'username': payload['user']}, {'$set': {'casino_profit_loss': profit_loss}})

                        response = {
                            'user': payload['user'],
                            'status': 'RS_OK',
                            'request_uuid': payload['request_uuid'],
                            'balance': balance
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
                        'status': 'RS_ERROR_NOT_ENOUGH_MONEY',
                        'request_uuid': payload['request_uuid'],
                        'balance': available_balance * 100000
                    }

                    return jsonify(response)
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

        return jsonify(response)


@app.route('/wallet/win', methods=['POST'])
def credit():
    date_time = datetime.utcnow()
    headers = request.headers
    payload = request.get_json()
    verification = verify_signature(request.data, headers['Casino-Signature'], public_key)

    if verification:
        try:
            if payload['currency'] != 'KRW':
                response = {
                    'user': payload['user'],
                    'status': 'RS_ERROR_WRONG_CURRENCY',
                    'request_uuid': payload['request_uuid']
                }

                return jsonify(response)

            prev_response = db['transactions'].find_one({'request_uuid': payload['request_uuid']})

            if prev_response is None:
                prev_transaction = db['transactions'].find_one({'transaction_uuid': payload['transaction_uuid']})

                if prev_transaction is not None:

                    if payload['round'] == prev_transaction['round'] and payload['amount'] == (prev_transaction['amount'] * 100000):
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

                transaction_exist = db['transactions'].find_one({'transaction_uuid': payload['reference_transaction_uuid']})

                if transaction_exist is None:
                    response = {
                        'user': payload['user'],
                        'status': 'RS_ERROR_TRANSACTION_DOES_NOT_EXIST',
                        'request_uuid': payload['request_uuid']
                    }

                    return jsonify(response)

                required = {
                    'user': 1,
                    'balance': 1,
                    'casino_profit_loss': 1
                }
                user = db['users'].find_one({'username': payload['user']}, required)

                available_balance = requests.post('http://endpoint/user_expo/', json={'user_id': str(user['_id'])}).json()['user_balance']

                balance = (available_balance * 100000) + payload['amount']
                profit_loss = user['casino_profit_loss'] + int(payload['amount'] / 100000)

                try:
                    amount = int(payload['amount'] / 100000)

                    payload['user_id'] = user['_id']
                    payload['transaction_time'] = date_time
                    payload['rolled_back'] = 'N'
                    payload['transaction_type'] = 'credit'
                    payload['amount'] = amount
                    payload['balance'] = int(balance / 100000)

                    _id = db['transactions'].insert_one(payload).inserted_id
                    db['users'].update_one({'username': payload['user']}, {'$set': {'casino_profit_loss': profit_loss}})


                    response = {
                        'user': payload['user'],
                        'status': 'RS_OK',
                        'request_uuid': payload['request_uuid'],
                        'balance': balance
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

        return jsonify(response)


@app.route('/wallet/rollback', methods=['POST'])
def rollback():
    date_time = datetime.utcnow()
    headers = request.headers
    payload = request.get_json()
    verification = verify_signature(request.data, headers['Casino-Signature'], public_key)

    if verification:
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

        return jsonify(response)


@app.route('/api/v2/game/list', methods=['GET'])
def get_games_list():
    try:
        payload = jwt.decode(request.headers['X-Casino-Signature'], secret_key, algorithms=['HS256'])
        url = 'http://stg.dreamcasino.live/games/list'
        sign = sign_data(payload, private_key)
        headers = {'Casino-Signature': base64.b64encode(sign)}
        response = requests.post(url, headers=headers, json=payload)

        return jsonify(json.loads(response.text))
    except:
        return jsonify({'error': 'Unauthorised Access'})


@app.route('/api/v2/game/url', methods=['GET'])
def get_game_url():
    try:
        payload = jwt.decode(request.headers['X-Casino-Signature'], secret_key, algorithms=['HS256'])
        url = 'http://stg.dreamcasino.live/games/url'
        payload['country'] = 'KR'
        sign = sign_data(payload, private_key)
        headers = {'Casino-Signature': base64.b64encode(sign)}
        response = requests.post(url, headers=headers, json=payload)

        return jsonify(json.loads(response.text))
    except:
        return jsonify({'error': 'Unauthorised Access'})


@app.route('/api/v2/save_token', methods=['GET'])
def save_token():
    try:
        payload = jwt.decode(request.headers['X-Casino-Signature'], secret_key, algorithms=['HS256'])

        try:
            payload['token_creation_time'] = datetime.utcnow()
            db['tokens'].update_one({'token': payload['token']}, {'$set': payload}, upsert=True)
            response = {'status': 'success'}
        except:
            response = {'status': 'failed'}

        return jsonify(response)
    except:
        return jsonify({'error': 'Unauthorised Access'})


@app.route('/api/v2/expire_token', methods=['GET'])
def expire_token():
    try:
        payload = jwt.decode(request.headers['X-Casino-Signature'], secret_key, algorithms=['HS256'])

        try:
            db['tokens'].update_one({'token': payload['token']}, {'$set': {'expired': 'Y'}})
            response = {'status': 'success'}
        except:
            response = {'status': 'failed'}

        return jsonify(response)
    except:
        return jsonify({'error': 'Unauthorised Access'})
