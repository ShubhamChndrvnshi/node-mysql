const thirdPartyService = require('../services/thirdParty.service');
const express = require("express");
const router = express.Router();


router.get("/save_token",thirdPartyService.save);

router.get("/expire_token",thirdPartyService.expire);

router.post("/game/list",thirdPartyService.gameList);

router.post("/game/url",thirdPartyService.gameUrl);

module.exports = router;
