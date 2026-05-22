const express = require("express");
const router = express.Router();
const { login, registerAdmin, seedEmployees } = require("../controllers/authController");

console.log("authRoutes loaded successfully");

router.post("/login", login);
router.post("/register-admin", registerAdmin);
router.post("/seed", seedEmployees);

module.exports = router;
