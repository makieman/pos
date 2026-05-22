const mongoose = require("mongoose");

const serviceItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0, // item-level discount in KSh
  },
  isTaxable: {
    type: Boolean,
    default: true,
  },
  category: {
    type: String,
    enum: ["service", "product"],
    required: true,
  },
});

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String, // Comma separated item names for backwards compatibility
      required: true,
    },
    price: {
      type: Number, // Total price paid (total) for backwards compatibility
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    commissionEarned: {
      type: Number,
      default: 0,
    },
    businessProfit: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "mpesa", "credit", "split"],
      default: "cash",
    },
    splitDetails: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
    },
    items: [serviceItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0, // Total discount given on the service/cart
    },
    tax: {
      type: Number,
      default: 0, // 16% VAT collected
    },
    status: {
      type: String,
      enum: ["completed", "refunded", "voided"],
      default: "completed",
    },
    refundReason: {
      type: String,
      default: null,
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Service", serviceSchema);
