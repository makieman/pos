const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["service", "product"],
      required: true,
    },
    description: {
      type: String,
    },
    stock: {
      type: Number,
      default: 0,
    },
    isTaxable: {
      type: Boolean,
      default: true,
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: {
      type: Number,
      default: 0,
    },
    isCommissionable: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model("Inventory", inventorySchema);
