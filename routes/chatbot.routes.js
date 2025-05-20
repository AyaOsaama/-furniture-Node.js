const express = require("express");
const router = express.Router();
const { chatbot } = require("../controller/chatbot.controller.js");

router.post("/", chatbot);

module.exports = router;
