const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
} = require("../controllers/expenseController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// 🔒 Admin only
router.post("/", protect, adminOnly, createExpense);
router.get("/", protect, adminOnly, getExpenses);

module.exports = router;
