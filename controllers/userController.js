const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ✅ Create Employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, commissionRate } = req.body;

    // Check if exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employee
    const employee = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "employee",
      commissionRate,
    });

    res.status(201).json({
      message: "Employee created",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        commissionRate: employee.commissionRate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get All Employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
