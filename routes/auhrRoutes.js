const express = require("express");
const router = express.Router();
const { login, registerAdmin } = require("../controllers/authcontroller");

router.post("/login", login);
router.post("/registerAdmin", registerAdmin);

module.exports = router;
