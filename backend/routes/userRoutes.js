const express = require("express");
const router = express.Router();

const {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// 🔒 Admin only
router.post("/", protect, adminOnly, createEmployee);
router.get("/", protect, adminOnly, getEmployees);
router.put("/:id", protect, adminOnly, updateEmployee);
router.delete("/:id", protect, adminOnly, deleteEmployee);

module.exports = router;
