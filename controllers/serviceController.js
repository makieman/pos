const Service = require("../models/Service");
const User = require("../models/User");

// ✅ Create Service
exports.createService = async (req, res) => {
  try {
    const { name, price, employeeId } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    let commission = 0;

    // 🔥 Commission Logic
    if (employee.commissionType === "percentage") {
      commission = (employee.commissionValue / 100) * price;
    } else if (employee.commissionType === "fixed") {
      commission = employee.commissionValue;
    }

    const profit = price - commission;

    const service = await Service.create({
      name,
      price,
      employee: employeeId,
      commissionEarned: commission,
      businessProfit: profit,
    });

    res.status(201).json({
      message: "Service recorded",
      service,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
