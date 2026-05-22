const Expense = require("../models/Expense");

// ✅ Add Expense
exports.createExpense = async (req, res) => {
  try {
    const { title, amount } = req.body;

    const expense = await Expense.create({ title, amount });

    res.status(201).json({
      message: "Expense added",
      expense,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get All Expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
