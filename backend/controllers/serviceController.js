const Service = require("../models/Service");
const User = require("../models/User");
const Inventory = require("../models/Inventory");
const Shift = require("../models/Shift");
const AuditLog = require("../models/AuditLog");

// ✅ Create Sale (Checkout)
exports.createService = async (req, res) => {
  try {
    // 1. Check if Accountant is trying to process sale (Acc cannot process sales)
    if (req.user.role === "accountant") {
      return res.status(403).json({ message: "Access Denied: Accountants cannot process sales." });
    }

    // 2. Check if there is an active open shift
    const activeShift = await Shift.findOne({ status: "open" });
    if (!activeShift) {
      return res.status(400).json({
        message: "No active shift is open. You must open a shift with a cash float first.",
        noActiveShift: true
      });
    }

    const { 
      items, 
      employeeId, 
      paymentMethod, 
      splitDetails, 
      cartDiscountPercent = 0, 
      amountTendered = 0 
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in the cart." });
    }

    const employee = await User.findById(employeeId || req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Staff member not found." });
    }

    let subtotal = 0;
    let itemDiscountsSum = 0;
    let taxableAmount = 0;
    const checkoutItems = [];

    // 3. Process each item (check stock, compute taxes and discounts)
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
        // Subtract stock
        invItem.stock -= 1;
        await invItem.save();

        // Create an audit entry for stock deduction
        await AuditLog.create({
          action: "STOCK_DEDUCTION",
          performedBy: req.user.id,
          details: `Subtracted 1 from ${invItem.name} due to sale. Remaining: ${invItem.stock}`,
        });
      }

      const price = invItem.price;
      const discount = Number(cartItem.discount) || 0; // item-level discount
      const itemSub = price - discount;
      
      subtotal += price;
      itemDiscountsSum += discount;
      
      if (invItem.isTaxable) {
        taxableAmount += itemSub;
      }

      checkoutItems.push({
        itemId: invItem._id,
        name: invItem.name,
        price,
        discount,
        isTaxable: invItem.isTaxable,
        category: invItem.category,
      });
    }

    // 4. Percentage Cart Discount
    const cartDiscount = (cartDiscountPercent / 100) * (subtotal - itemDiscountsSum);
    const totalDiscount = itemDiscountsSum + cartDiscount;

    // Waiter restriction: Waiters cannot apply discounts
    if (req.user.role === "waiter" && totalDiscount > 0) {
      return res.status(403).json({ message: "Access Denied: Waiters are not permitted to apply discounts." });
    }

    // 5. Compute Tax (16% VAT on taxable items after item discount and proportional cart discount)
    const discountProportion = totalDiscount / subtotal;
    const discountedTaxableAmount = taxableAmount * (1 - (subtotal > 0 ? discountProportion : 0));
    const tax = Math.round(discountedTaxableAmount * 0.16);

    const grandTotal = Math.max(0, subtotal - totalDiscount + tax);

    // 6. Change Calculation
    let change = 0;
    if (paymentMethod === "cash" && amountTendered > 0) {
      change = amountTendered - grandTotal;
    }

    // 7. Calculate Commission
    let commission = 0;
    if (employee.commissionType === "percentage") {
      commission = (employee.commissionValue / 100) * grandTotal;
    } else if (employee.commissionType === "fixed") {
      commission = employee.commissionValue;
    }
    const businessProfit = grandTotal - commission;

    // 8. Create Service Sale Record
    const service = await Service.create({
      name: checkoutItems.map(i => i.name).join(", "),
      price: grandTotal,
      employee: employee._id,
      commissionEarned: commission,
      businessProfit,
      paymentMethod,
      splitDetails: splitDetails || { cash: 0, card: 0 },
      items: checkoutItems,
      subtotal,
      discount: totalDiscount,
      tax,
      status: "completed",
      shift: activeShift ? activeShift._id : null,
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
      .sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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

    // Check if the shift is closed
    const associatedShift = await Shift.findById(service.shift);
    if (associatedShift && associatedShift.status === "closed") {
      // Require Manager or Admin or Supervisor override
      if (!["admin", "manager", "supervisor"].includes(req.user.role)) {
        return res.status(403).json({
          message: "Access Denied: Voiding a closed shift transaction requires a Manager or Supervisor override.",
        });
      }
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
