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
        enum:["admin","employee"],
        default:"employee",
    },
    commissionRate:{
        type:Number,
        default:0,
    },
    },
    { timeStamps:true }
   
);
module.export =mongoose.module("user",userSchema)