const express = require("express");
const router = express.Router();

const {
  createService,
  getServices,
  getCommissionReport,
  payCommissions,
  refundService,
  voidService,
} = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware");

// Commission routes MUST come before /:id routes so Express
// doesn't interpret "commissions" as a MongoDB ObjectId param
router.get("/commissions", protect, getCommissionReport);
router.post("/commissions/pay", protect, payCommissions);

router.get("/", protect, getServices);
router.post("/", protect, createService);
router.post("/:id/refund", protect, refundService);
router.post("/:id/void", protect, voidService);

module.exports = router;
