const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    openingFloat: {
      type: Number,
      required: true,
    },
    closingCash: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    cashSales: {
      type: Number,
      default: 0,
    },
    cashRefunds: {
      type: Number,
      default: 0,
    },
    grossTotal: {
      type: Number,
      default: 0,
    },
    netSales: {
      type: Number,
      default: 0,
    },
    taxCollected: {
      type: Number,
      default: 0,
    },
    discounts: {
      type: Number,
      default: 0,
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

module.exports = mongoose.model("Shift", shiftSchema);
