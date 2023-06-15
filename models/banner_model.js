const mongoose = require("mongoose");

const bannerdSchema = new mongoose.Schema({
  
   image:[{
    type:String,
    required:true
    
   
   }],

   baner_status: {
      default: true,
      type: Boolean,
      required: true,
    },


   
   createdAt:{
    type:Date,
 
    required:true,
    default:Date.now
   },
  
  });



  module.exports=mongoose.model("banner",bannerdSchema)