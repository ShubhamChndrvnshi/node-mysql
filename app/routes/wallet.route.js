const walletService = require('../services/wallet.service');
const apiResponse = require("../../common/apiResponse");
const express = require("express");
const router = express.Router();

router.post("/balance", walletService.balance);

router.post("/bet",walletService.debit);

router.post("/win",walletService.credit);


module.exports = router;


