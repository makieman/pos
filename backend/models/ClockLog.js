const mongoose = require("mongoose");

const clockLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clockIn: {
      type: Date,
      required: true,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["in", "out"],
      default: "in",
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

module.exports = mongoose.model("ClockLog", clockLogSchema);
