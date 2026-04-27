const express = require("express");
const router = express.Router();

const { createService } = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createService);

module.exports = router;
