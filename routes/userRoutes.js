const express = require("express");
const router = express.Router();

const {
  createEmployee,
  getEmployees,
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// 🔒 Admin only
router.post("/", protect, adminOnly, createEmployee);
router.get("/", protect, adminOnly, getEmployees);

module.exports = router;
