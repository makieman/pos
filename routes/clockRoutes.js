const express = require("express");
const router = express.Router();
const {
  clockIn,
  clockOut,
  getClockStatus,
  getAllClockLogs,
} = require("../controllers/clockController");
const { protect } = require("../middleware/authMiddleware");

router.get("/status", protect, getClockStatus);
router.post("/in", protect, clockIn);
router.post("/out", protect, clockOut);
router.get("/all", protect, getAllClockLogs);

module.exports = router;
