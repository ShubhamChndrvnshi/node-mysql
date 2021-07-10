const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const {base64encode} = require('nodejs-base64');
// const crypto = require("crypto");
const crypto = require('crypto');


function createSignature(data) {
    let sign = crypto.createSign('SHA256');
    sign.write(JSON.stringify(data));
    sign.end();
    const key = fs.readFileSync(private_keyPath, "utf8");;
    let sign_str = sign.sign(key, 'base64');
    console.log(sign_str);
    return sign_str;
}

function verifySignature(data, sign) {

    const pubkey = fs.readFileSync(public_keyPath, "utf8");
    let verifier = crypto.createVerify('SHA256');
    verifier.update(data);
    return verifier.verify(pubkey, sign, 'base64');

}

// data = {
//     partner_id: 'REPLACE_YOUR_PARTNER_ID',
// }

// axios.post(
//     'http://83.136.253.37/games/list',
//     data,
//     {
//         headers: {
//             'Content-Type': 'application/json',
//             'Casino-Signature': createSignature(data)
//         }
//     }
// ).then(response => {
//     // HERE YOU'LL GET GAME LIST
//     console.log(response);
// }).then(error => {
//     console.log(error);
// });



/* GET home page. */
router.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/../../public/index.html"));
});

let private_keyPath = path.resolve("./app/services/PrivateKey.pem");
let public_keyPath = path.resolve("./app/services/PublicKey.pem");


router.post("/sign/token", async (req, res) => {
    try{
        console.log(req.body);
        const signature = createSignature(req.body);
        console.log(`signature for '${JSON.stringify(req.body)}' is '${signature}'"`);
        res.json({signed: (signature)})
    }catch(err){
        console.log(err);
    }
})

router.post("/verify/token", (req, res) => { // validate sign
    let signature = req.body.signed;
    let data = JSON.stringify(req.body.data);
    const isTrue = verifySignature(data, signature);  
    res.json({verified: isTrue});
})


// function sign_data(data) {
//     data = JSON.stringify(data);
//     let sign = crypto.createSign('SHA256');
// 	sign.write(data);
// 	sign.end();
// 	const key = fs.readFileSync(private_keyPath);
// 	return sign.sign(key, 'base64');
// }

// function verify_signature(data, signature) {
//     data = JSON.stringify(data);
//     const key = fs.readFileSync(private_keyPath);
//     const pubkey = fs.readFileSync(public_keyPath);
// 	verifier = crypto.createVerify('SHA256');
// 	verifier.update(data);
// 	return verifier.verify (pubkey, signature,'base64');
// }

module.exports = router;
