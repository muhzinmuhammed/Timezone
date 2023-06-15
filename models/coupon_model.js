const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
   code:{
    type:String,
    
    required:true
   },

   discount:{
    type:Number,
    
    required:true
   },

   description:{
    type:String,
   
    required:true
   },

 
  
 
   createdAt:{
    type:Date,
 
    required:true,
    
   },
   status: {
    type: Boolean,
    default: true
  },

  });

  

  const coupon=mongoose.model("coupon",couponSchema)
  module.exports=coupon;