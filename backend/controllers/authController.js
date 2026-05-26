const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    // Check Lockout Status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitTime = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
      return res.status(403).json({
        message: `Account is temporarily locked. Please try again in ${waitTime} minutes.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }
      await user.save();
      return res.status(401).json({
        message: "Incorrect email or password",
        failedAttempts: user.failedLoginAttempts,
        attemptsRemaining: Math.max(0, 5 - user.failedLoginAttempts),
      });
    }

    // Login successful - Reset failed attempts & generate session token
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.activeSessionId = sessionId;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      commissionType: "percentage",
      commissionValue: 0,
    });

    await admin.save();
    res.status(201).json({
      message: "Admin registered",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Seeding endpoint to easily set up all roles for testing
exports.seedEmployees = async (req, res) => {
  try {
    const roles = ["admin", "manager", "cashier", "accountant", "supervisor", "waiter"];
    const seedResults = [];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    for (const role of roles) {
      const email = `${role}@salon.com`;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: `${role.charAt(0).toUpperCase() + role.slice(1)} Staff`,
          email,
          password: hashedPassword,
          role,
          commissionType: "percentage",
          commissionValue: role === "waiter" ? 5 : 10,
        });
      }
      seedResults.push({
        id: user._id,
        email: user.email,
        role: user.role,
      });
    }

    res.json({
      message: "Employees seeded successfully",
      users: seedResults,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
