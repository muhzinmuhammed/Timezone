const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
   name:{
    type:String,
    
    required:true
   },

   email:{
    type:String,
    
    required:true
   },

   phone:{
    type:Number,
   
    required:true
   },

  
   password: {
		type: String,
		required: true
	},
   coupon:{
      type:[String]
   },

   image:[{
      type:String

   }],
   gender:{
      type:String,
      enum: ["male", "female", "other"]
   },
   address:[{
      name: String,
      phone: Number,
      email: String,
      address1: String,
      address2: String,
      town:String,
      postcode:Number

   }],
   createdAt:{
    type:Date,
 
    required:true,
    default:Date.now
   },
   isBlocked: {
    type: Boolean,
    default: false
  },

  });

  

  module.exports=mongoose.model("new_users",userSchema)