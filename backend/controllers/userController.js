const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ✅ Create Employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, commissionType, commissionValue } = req.body;

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
      role: role || "cashier",
      commissionType,
      commissionValue,
    });

    res.status(201).json({
      message: "Employee created",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        commissionType: employee.commissionType,
        commissionValue: employee.commissionValue,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get All Employees (retrieve all registered users to manage in Employee view)
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update Employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.password; // never allow password update here
    const employee = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee updated', employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findByIdAndDelete(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
