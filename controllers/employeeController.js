const Employee = require("../models/Employee");

// create employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, commissionRate } = req.body;
    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "employee already exists" });
    }
    const employee = new Employee({
      name,
      email,
      password,
      role,
      commissionRate,
    });
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
 // Get all employees
 exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
