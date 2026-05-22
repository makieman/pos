const express = require("express");
const router = express.Router();
const {
  openShift,
  getCurrentShift,
  closeShift,
  getZReport,
  getDailyRollup,
} = require("../controllers/shiftController");
const { protect } = require("../middleware/authMiddleware");

router.get("/current", protect, getCurrentShift);
router.post("/open", protect, openShift);
router.post("/close", protect, closeShift);
router.get("/rollup", protect, getDailyRollup);
router.get("/:id/z-report", protect, getZReport);

module.exports = router;
