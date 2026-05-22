const express = require("express");
const router = express.Router();

const { 
  createService, 
  getServices,
  refundService,
  voidService
} = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getServices);
router.post("/", protect, createService);
router.post("/:id/refund", protect, refundService);
router.post("/:id/void", protect, voidService);

module.exports = router;
