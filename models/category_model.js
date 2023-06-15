const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  
   category_name:{
    type:String,
    
   
   },

   image:{
    type:String,
    
    required:true
   },
   createdAt:{
    type:Date,
 
    required:true,
    default:Date.now
   },
  
  });



  module.exports=mongoose.model("category_collections",categorySchema)