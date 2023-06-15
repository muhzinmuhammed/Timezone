const mongoose=require('mongoose')

var schema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true,
        unique:true
    },
   
  
   password:{
    type:String,
    min: [6, 'Must be at least 6, got {VALUE}'],

   }
   

})


const UserDb=mongoose.model('admin_login',schema)
module.exports=UserDb