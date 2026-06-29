const Service = require("../models/Service");
const User = require("../models/User");
const Inventory = require("../models/Inventory");
const AuditLog = require("../models/AuditLog");

// ✅ Create Sale (Checkout)
exports.createService = async (req, res) => {
  try {
    // 1. Accountants cannot process sales
    if (req.user.role === "accountant") {
      return res.status(403).json({ message: "Access Denied: Accountants cannot process sales." });
    }

    const {
      items,
      paymentMethod,
      splitDetails,
      cartDiscountPercent = 0,
      amountTendered = 0,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in the cart." });
    }

    let subtotal = 0;
    let itemDiscountsSum = 0;
    let taxableAmount = 0;
    const checkoutItems = [];

    // 2. Process each item — fetch inventory, compute commission per item
    for (const cartItem of items) {
      const invItem = await Inventory.findById(cartItem.id);
      if (!invItem) {
        return res.status(404).json({ message: `Item ${cartItem.name} not found in inventory.` });
      }

      // Check stock for products
      if (invItem.category === "product") {
        if (invItem.stock <= 0) {
          return res.status(400).json({ message: `Product ${invItem.name} is out of stock!` });
        }
        invItem.stock -= 1;
        await invItem.save();

        await AuditLog.create({
          action: "STOCK_DEDUCTION",
          performedBy: req.user.id,
          details: `Subtracted 1 from ${invItem.name} due to sale. Remaining: ${invItem.stock}`,
        });
      }

      const price = invItem.price;
      const discount = Number(cartItem.discount) || 0;
      const itemSub = price - discount;

      subtotal += price;
      itemDiscountsSum += discount;

      if (invItem.isTaxable) {
        taxableAmount += itemSub;
      }

      // Calculate commission per item from inventory commission settings
      let commissionEarned = 0;
      const commissionType = invItem.commissionType || "percentage";
      const commissionValue = invItem.commissionValue || 0;

      if (commissionType === "percentage") {
        commissionEarned = (commissionValue / 100) * itemSub;
      } else if (commissionType === "fixed") {
        commissionEarned = commissionValue;
      }

      checkoutItems.push({
        itemId: invItem._id,
        name: invItem.name,
        price,
        discount,
        isTaxable: invItem.isTaxable,
        category: invItem.category,
        employeeId: cartItem.employeeId || null,
        commissionType,
        commissionValue,
        commissionEarned,
      });
    }

    // 3. Percentage Cart Discount
    const cartDiscount = (cartDiscountPercent / 100) * (subtotal - itemDiscountsSum);
    const totalDiscount = itemDiscountsSum + cartDiscount;

    // Waiter restriction: cannot apply discounts
    if (req.user.role === "waiter" && totalDiscount > 0) {
      return res.status(403).json({ message: "Access Denied: Waiters are not permitted to apply discounts." });
    }

    // 4. Compute Tax (16% VAT on taxable items after proportional discount)
    const discountProportion = totalDiscount / subtotal;
    const discountedTaxableAmount = taxableAmount * (1 - (subtotal > 0 ? discountProportion : 0));
    const tax = Math.round(discountedTaxableAmount * 0.16);

    const grandTotal = Math.max(0, subtotal - totalDiscount + tax);

    // 5. Change Calculation
    let change = 0;
    if (paymentMethod === "cash" && amountTendered > 0) {
      change = amountTendered - grandTotal;
    }

    // 6. Total commission = sum of all item commissions
    const totalCommission = checkoutItems.reduce((sum, i) => sum + i.commissionEarned, 0);
    const businessProfit = grandTotal - totalCommission;

    // 7. Create Service Sale Record
    const service = await Service.create({
      name: checkoutItems.map((i) => i.name).join(", "),
      price: grandTotal,
      employee: req.user.id, // Cashier who processed the transaction
      commissionEarned: totalCommission,
      businessProfit,
      paymentMethod,
      splitDetails: splitDetails || { cash: 0, card: 0 },
      items: checkoutItems,
      subtotal,
      discount: totalDiscount,
      tax,
      status: "completed",
    });

    res.status(201).json({
      message: "Sale recorded successfully",
      service,
      change,
      amountTendered,
      grandTotal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get All Sales
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate("employee", "name email role")
      .populate("items.employeeId", "name email role")
      .sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get Commission Report (per-employee daily breakdown)
exports.getCommissionReport = async (req, res) => {
  try {
    // Accept optional ?date=2026-06-28 query param. Default to today.
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const sales = await Service.find({
      createdAt: { $gte: start, $lte: end },
      status: "completed",
    }).populate("items.employeeId", "name email role");

    // Group commission by employee using item-level employeeId
    const employeeMap = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        if (!item.employeeId) continue; // Skip unassigned items

        const empId = item.employeeId._id.toString();

        if (!employeeMap[empId]) {
          employeeMap[empId] = {
            employeeId: empId,
            employeeName: item.employeeId.name,
            employeeEmail: item.employeeId.email,
            totalCommission: 0,
            alreadyPaid: false,
            paidAt: null,
            items: [],
          };
        }

        employeeMap[empId].totalCommission += item.commissionEarned;

        // Mark as paid if ANY item is paid (all items for the same employee
        // on the same date are paid together by payCommissions)
        if (item.commissionPaid) {
          employeeMap[empId].alreadyPaid = true;
          employeeMap[empId].paidAt = item.commissionPaidAt;
        }

        employeeMap[empId].items.push({
          saleId: sale._id,
          serviceName: item.name,
          price: item.price,
          discount: item.discount,
          commissionType: item.commissionType,
          commissionValue: item.commissionValue,
          commissionEarned: item.commissionEarned,
          commissionPaid: item.commissionPaid,
          commissionPaidAt: item.commissionPaidAt,
        });
      }
    }

    res.json({
      date: date.toISOString().split("T")[0],
      report: Object.values(employeeMap),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Pay Commissions (marks as paid + creates expense record)
exports.payCommissions = async (req, res) => {
  try {
    // Role check: only admin or manager can pay commissions
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied: Only Admin or Manager can pay commissions.",
      });
    }

    const { employeeId, employeeName, amount, date } = req.body;

    if (!employeeId || !amount || amount <= 0) {
      return res.status(400).json({
        message: "employeeId and a valid amount are required.",
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    // 1. Double-payment guard — check if any item for this employee is already paid today
    const alreadyPaid = await Service.findOne({
      createdAt: { $gte: start, $lte: end },
      status: "completed",
      items: {
        $elemMatch: {
          employeeId: employeeId,
          commissionPaid: true,
        },
      },
    });

    if (alreadyPaid) {
      return res.status(400).json({
        message: `Commission for ${employeeName} has already been paid for ${targetDate.toISOString().split("T")[0]}.`,
      });
    }

    // 2. Use arrayFilters positional operator to update only this employee's items
    await Service.updateMany(
      {
        createdAt: { $gte: start, $lte: end },
        status: "completed",
        "items.employeeId": employeeId,
      },
      {
        $set: {
          "items.$[elem].commissionPaid": true,
          "items.$[elem].commissionPaidAt": new Date(),
        },
      },
      {
        arrayFilters: [{ "elem.employeeId": employeeId }],
      }
    );

    // 3. Create expense record
    const Expense = require("../models/Expense");
    const expense = await Expense.create({
      title: `Commission — ${employeeName} — ${targetDate.toISOString().split("T")[0]}`,
      amount: Math.round(amount),
    });

    // 4. Audit log
    await AuditLog.create({
      action: "COMMISSION_PAID",
      performedBy: req.user.id,
      details: `Paid KSh ${amount} commission to ${employeeName} for ${targetDate.toISOString().split("T")[0]}. Expense ID: ${expense._id}`,
    });

    res.json({
      message: `Commission of KSh ${amount} paid to ${employeeName} and recorded as expense.`,
      expense,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Issue Refund
exports.refundService = async (req, res) => {
  try {
    // Role restriction: Cashier and Waiter cannot refund
    if (["cashier", "waiter"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied: Cashiers and Waiters are not permitted to issue refunds.",
      });
    }

    // Accountant restriction
    if (req.user.role === "accountant") {
      return res.status(403).json({ message: "Access Denied: Accountants cannot modify transactions." });
    }

    const { id } = req.params;
    const { refundReason } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Transaction record not found." });
    }

    if (service.status === "refunded") {
      return res.status(400).json({ message: "This transaction is already refunded." });
    }

    // 1. Restock products in inventory
    for (const item of service.items) {
      if (item.category === "product" && item.itemId) {
        const inv = await Inventory.findById(item.itemId);
        if (inv) {
          inv.stock += 1;
          await inv.save();

          await AuditLog.create({
            action: "RESTOCK",
            performedBy: req.user.id,
            details: `Restocked 1 unit of ${inv.name} due to refund. New stock: ${inv.stock}`,
          });
        }
      }
    }

    // 2. Set status to refunded
    service.status = "refunded";
    service.refundReason = refundReason || "Customer refund request";
    await service.save();

    // 3. Create Audit entry for refund
    await AuditLog.create({
      action: "REFUND",
      performedBy: req.user.id,
      details: `Refunded transaction ${service._id} of amount KSh ${service.price}. Reason: ${service.refundReason}`,
    });

    res.json({
      message: "Refund issued successfully. Inventory has been restocked.",
      service,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Void Transaction
exports.voidService = async (req, res) => {
  try {
    // Cashier/Waiter cannot void
    if (["cashier", "waiter"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied: Cashiers and Waiters are not permitted to void transactions.",
      });
    }

    // Accountant restriction
    if (req.user.role === "accountant") {
      return res.status(403).json({ message: "Access Denied: Accountants cannot void transactions." });
    }

    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Transaction record not found." });
    }

    if (service.status === "voided") {
      return res.status(400).json({ message: "This transaction is already voided." });
    }

    // 1. Restock products in inventory
    for (const item of service.items) {
      if (item.category === "product" && item.itemId) {
        const inv = await Inventory.findById(item.itemId);
        if (inv) {
          inv.stock += 1;
          await inv.save();

          await AuditLog.create({
            action: "RESTOCK",
            performedBy: req.user.id,
            details: `Restocked 1 unit of ${inv.name} due to void. New stock: ${inv.stock}`,
          });
        }
      }
    }

    // 2. Set status to voided
    service.status = "voided";
    await service.save();

    // 3. Create Audit entry for void
    await AuditLog.create({
      action: "VOID",
      performedBy: req.user.id,
      details: `Voided transaction ${service._id} of amount KSh ${service.price}.`,
    });

    res.json({
      message: "Transaction voided successfully.",
      service,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
