const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    return res.send("register admin working");
    
    const { name, email, password } = req.body;
    const existing = await Employee.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "employee already exists" });
    }

    const employee = new Employee({
      name,
      email,
      password,
      role: "admin",
      commissionRate: 0,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
