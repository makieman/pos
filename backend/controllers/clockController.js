const ClockLog = require("../models/ClockLog");

// ✅ Clock In
exports.clockIn = async (req, res) => {
  try {
    const existing = await ClockLog.findOne({
      employee: req.user.id,
      status: "in",
    });

    if (existing) {
      return res.status(400).json({
        message: "You are already clocked in.",
        log: existing,
      });
    }

    const log = await ClockLog.create({
      employee: req.user.id,
      clockIn: new Date(),
      status: "in",
    });

    res.status(201).json({
      message: "Clock-in recorded successfully",
      log,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Clock Out
exports.clockOut = async (req, res) => {
  try {
    const log = await ClockLog.findOne({
      employee: req.user.id,
      status: "in",
    });

    if (!log) {
      return res.status(400).json({ message: "You are not clocked in." });
    }

    log.clockOut = new Date();
    log.status = "out";
    await log.save();

    res.json({
      message: "Clock-out recorded successfully",
      log,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Clock Status & Logs
exports.getClockStatus = async (req, res) => {
  try {
    const current = await ClockLog.findOne({
      employee: req.user.id,
      status: "in",
    });

    const logs = await ClockLog.find({ employee: req.user.id })
      .sort({ clockIn: -1 })
      .limit(10);

    res.json({
      isClockedIn: !!current,
      currentLog: current,
      logs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Clock Logs (for Admin/Reports)
exports.getAllClockLogs = async (req, res) => {
  try {
    const logs = await ClockLog.find()
      .populate("employee", "name email role")
      .sort({ clockIn: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
