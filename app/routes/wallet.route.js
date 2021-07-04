const walletService = require('../services/wallet.service');
const apiResponse = require("../../common/apiResponse");
const express = require("express");
const router = express.Router();

router.post("/balance", walletService.balance);

router.post("/bet",walletService.bet);

// //Logged user can get it's wishlisted properties
// router.post("/get",);


module.exports = router;


