const thirdPartyService = require('../services/thirdParty.service');
const express = require("express");
const router = express.Router();


router.get("/save_token",thirdPartyService.save);

router.get("/expire_token",thirdPartyService.expire);

router.get("/game/list",thirdPartyService.gameList);

router.get("/game/url",thirdPartyService.gameUrl);

module.exports = router;






