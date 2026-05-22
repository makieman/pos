const Inventory = require("../models/Inventory");

// ✅ Get All Inventory Items
exports.getItems = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error("Error in getItems:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Create Inventory Item
exports.createItem = async (req, res) => {
  try {
    const { name, price, category, description, stock, isTaxable } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: "Name, price, and category are required" });
    }

    const item = await Inventory.create({
      name,
      price,
      category,
      description,
      stock: category === "product" ? stock || 0 : undefined,
      isTaxable: isTaxable !== undefined ? isTaxable : true,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Error in createItem:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update Inventory Item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, stock, isTaxable } = req.body;

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    item.name = name !== undefined ? name : item.name;
    item.price = price !== undefined ? price : item.price;
    item.category = category !== undefined ? category : item.category;
    item.description = description !== undefined ? description : item.description;
    item.isTaxable = isTaxable !== undefined ? isTaxable : item.isTaxable;
    
    if (item.category === "product") {
      item.stock = stock !== undefined ? stock : item.stock;
    } else {
      item.stock = undefined;
    }

    await item.save();
    res.json(item);
  } catch (error) {
    console.error("Error in updateItem:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete Inventory Item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    await item.deleteOne();
    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    console.error("Error in deleteItem:", error);
    res.status(500).json({ message: "Server error" });
  }
};
