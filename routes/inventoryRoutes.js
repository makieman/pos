const express = require("express");
const router = express.Router();
const {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/inventoryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ✅ All routes are protected. Creating/updating/deleting is restricted to Admin role.
router.get("/", protect, getItems);
router.post("/", protect, adminOnly, createItem);
router.put("/:id", protect, adminOnly, updateItem);
router.delete("/:id", protect, adminOnly, deleteItem);

module.exports = router;
