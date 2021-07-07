const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
var axios = require('axios');
var qs = require('qs');
var HTMLParser = require('node-html-parser');

/* GET home page. */
router.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/../../public/index.html"));
});

router.post("/sign/token", async (req, res) => {
    let private_keyPath = path.resolve("./app/services/ProductionPrivateKey.pem");
    let public_keyPath = path.resolve("./app/services/ProductionPublicKey.pem");
    const publicKey = fs.readFileSync(public_keyPath, "utf8");
    const privateKey = fs.readFileSync(private_keyPath, "utf8");
    var data = qs.stringify({
        'methodName': 'RSA_SIGN_VERIFY_MESSAGEE',
        'encryptdecryptparameter': 'decryprt',
        'publickeyparam': publicKey,
        'privatekeyparam': privateKey,
        'message': JSON.stringify(req.body),
        'cipherparameter': 'SHA256withRSA'
    });
    var config = {
        method: 'post',
        url: 'https://8gwifi.org/RSAFunctionality',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };

    axios(config).then(function (response) {
        console.log(response.data);
        let html = HTMLParser.parse(response.data);
        let signed = html.childNodes[2].childNodes[0]._rawText;
        res.json({signed: signed});
    }).catch(function (error) {
        console.log(error);
    });  
})

router.post("/verify/token", (req, res) => {
    let public_keyPath = path.resolve("./app/services/ProductionPublicKey.pem");
    let sign = req.headers['casino-signature'];
    console.log(sign);
    const pubkey = fs.readFileSync(public_keyPath);
    verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(req.body));
    res.json({
        verified: verifier.verify(pubkey, sign, 'base64')
    });
})


module.exports = router;
