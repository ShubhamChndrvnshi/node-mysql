const express = require("express");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const crypto = require("crypto");

/* GET home page. */
router.get("/", function (req, res) {
	res.sendFile(path.join(__dirname + "/../../public/index.html"));
});

router.post("/sign/token", (req, res) => {
	let private_keyPath = path.resolve("./app/services/ProductionPrivateKey.pem");
	let sign = crypto.createSign('SHA256');
	sign.write(JSON.stringify(req.body));
	sign.end();
	const key = fs.readFileSync(private_keyPath);
	res.json({singed: sign.sign(key, 'base64')});
})

router.post("/verify/token", (req, res) => {
	let public_keyPath = path.resolve("./app/services/ProductionPublicKey.pem");
	let sign = req.headers['casino-signature'];
	console.log(sign);
	const pubkey = fs.readFileSync(public_keyPath);
    verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(req.body));
	res.json({ verified: verifier.verify(pubkey, sign,'base64')});
})

module.exports = router;
