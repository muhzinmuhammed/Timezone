const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  
   brand:{
    type:String,
    required:true
    
   
   },

   
   createdAt:{
    type:Date,
 
    required:true,
    default:Date.now
   },
  
  });



  module.exports=mongoose.model("brand_collection",brandSchema)