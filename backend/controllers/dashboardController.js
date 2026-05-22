const Service = require("../models/Service");
const Expense = require("../models/Expense");

// ✅ Dashboard Summary
exports.getDashboard = async (req, res) => {
  try {
    const services = await Service.find();
    const expenses = await Expense.find();

    // Total income from all services (KSh)
    const totalIncome = services.reduce((sum, s) => sum + s.price, 0);

    // Total commissions paid to employees (KSh)
    const totalCommission = services.reduce(
      (sum, s) => sum + s.commissionEarned,
      0
    );

    // Total expenses e.g. rent, supplies (KSh)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Net Profit = Income - Commissions - Expenses
    const netProfit = totalIncome - totalCommission - totalExpenses;

    res.json({
      totalIncome,
      totalCommission,
      totalExpenses,
      netProfit,
      currency: "KSh",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
