const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
   {
    name: {
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password: {
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:["admin", "manager", "cashier", "accountant", "supervisor", "waiter"],
        default:"cashier",
    },
    commissionType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    commissionValue: {
      type: Number,
      default: 0,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
    activeSessionId: {
      type: String,
      default: null,
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
module.exports = mongoose.model("User",userSchema);