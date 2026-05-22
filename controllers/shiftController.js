const Shift = require("../models/Shift");
const Service = require("../models/Service");

// ✅ Open a new shift
exports.openShift = async (req, res) => {
  try {
    const { openingFloat } = req.body;

    // Check if there is already an open shift
    const existing = await Shift.findOne({ status: "open" });
    if (existing) {
      return res.status(400).json({
        message: "A shift is already active. Close it before opening a new one.",
        shift: existing,
      });
    }

    const shift = await Shift.create({
      openedBy: req.user.id,
      openingFloat: Number(openingFloat) || 0,
      status: "open",
    });

    res.status(201).json({
      message: "Shift opened successfully",
      shift,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get current active shift
exports.getCurrentShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ status: "open" }).populate("openedBy", "name email");
    if (!shift) {
      return res.json({ active: false });
    }
    res.json({ active: true, shift });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Close active shift
exports.closeShift = async (req, res) => {
  try {
    const { closingCash } = req.body;

    const shift = await Shift.findOne({ status: "open" });
    if (!shift) {
      return res.status(404).json({ message: "No active open shift found." });
    }

    // Find all services associated with this shift
    const services = await Service.find({ shift: shift._id });

    let cashSales = 0;
    let cashRefunds = 0;
    let grossTotal = 0;
    let taxCollected = 0;
    let discounts = 0;

    services.forEach((s) => {
      if (s.status === "completed") {
        grossTotal += s.price;
        taxCollected += s.tax || 0;
        discounts += s.discount || 0;

        if (s.paymentMethod === "cash") {
          cashSales += s.price;
        } else if (s.paymentMethod === "split") {
          cashSales += s.splitDetails?.cash || 0;
        }
      } else if (s.status === "refunded") {
        // Track refunds
        const refundAmt = s.price;
        if (s.paymentMethod === "cash") {
          cashRefunds += refundAmt;
        } else if (s.paymentMethod === "split") {
          cashRefunds += s.splitDetails?.cash || 0;
        }
      }
    });

    const netSales = grossTotal - cashRefunds;

    shift.cashSales = cashSales;
    shift.cashRefunds = cashRefunds;
    shift.grossTotal = grossTotal;
    shift.netSales = netSales;
    shift.taxCollected = taxCollected;
    shift.discounts = discounts;
    shift.closingCash = Number(closingCash) || 0;
    shift.status = "closed";
    shift.closedAt = new Date();

    await shift.save();

    res.json({
      message: "Shift closed successfully",
      shift,
      transactionsCount: services.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Z-report details for a specific shift
exports.getZReport = async (req, res) => {
  try {
    const { id } = req.params;
    let shift = await Shift.findById(id).populate("openedBy", "name email");
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const services = await Service.find({ shift: shift._id }).populate("employee", "name email");

    if (shift.status === "open") {
      let cashSales = 0;
      let cashRefunds = 0;
      let grossTotal = 0;
      let taxCollected = 0;
      let discounts = 0;

      services.forEach((s) => {
        if (s.status === "completed") {
          grossTotal += s.price;
          taxCollected += s.tax || 0;
          discounts += s.discount || 0;

          if (s.paymentMethod === "cash") {
            cashSales += s.price;
          } else if (s.paymentMethod === "split") {
            cashSales += s.splitDetails?.cash || 0;
          }
        } else if (s.status === "refunded") {
          const refundAmt = s.price;
          if (s.paymentMethod === "cash") {
            cashRefunds += refundAmt;
          } else if (s.paymentMethod === "split") {
            cashRefunds += s.splitDetails?.cash || 0;
          }
        }
      });

      const netSales = grossTotal - cashRefunds;

      shift = shift.toObject();
      shift.cashSales = cashSales;
      shift.cashRefunds = cashRefunds;
      shift.grossTotal = grossTotal;
      shift.netSales = netSales;
      shift.taxCollected = taxCollected;
      shift.discounts = discounts;
    }

    res.json({
      shift,
      transactions: services,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get daily rollup (summary of all shifts or two consecutive shifts)
exports.getDailyRollup = async (req, res) => {
  try {
    // Get the last 2 closed shifts
    const closedShifts = await Shift.find({ status: "closed" })
      .sort({ closedAt: -1 })
      .limit(2)
      .populate("openedBy", "name email");

    const totalGross = closedShifts.reduce((sum, s) => sum + s.grossTotal, 0);
    const totalNet = closedShifts.reduce((sum, s) => sum + s.netSales, 0);
    const totalTax = closedShifts.reduce((sum, s) => sum + s.taxCollected, 0);
    const totalDiscounts = closedShifts.reduce((sum, s) => sum + s.discounts, 0);
    const totalFloat = closedShifts.reduce((sum, s) => sum + s.openingFloat, 0);
    const totalCashSales = closedShifts.reduce((sum, s) => sum + s.cashSales, 0);
    const totalCashRefunds = closedShifts.reduce((sum, s) => sum + s.cashRefunds, 0);

    res.json({
      shifts: closedShifts,
      rollup: {
        shiftsCount: closedShifts.length,
        openingFloat: totalFloat,
        cashSales: totalCashSales,
        cashRefunds: totalCashRefunds,
        grossTotal: totalGross,
        netSales: totalNet,
        taxCollected: totalTax,
        discounts: totalDiscounts,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
