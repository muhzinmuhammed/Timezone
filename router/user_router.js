require("dotenv").config();

const express = require("express");
const user_route = express.Router();

const user_model=require('../models/users_models')
const multer = require("multer");

const fs = require("fs");




user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

const user_controller = require("../controller/user_controller");
const product_models = require("../models/product_models");


const isAuth=(req,res,next)=>{

  if(req.session.isAuth){
    next()
  }
  else{
    res.redirect('/')
  }
}


  const userStatus = async (req, res, next) => {
    const id=req.session.userId
    
    const userModel = await user_model.findById( id ).where({isBlocked:true});
    const products = await product_models.find().limit(6).where({product_status:true});
    if (userModel) {
      
    
      req.session.isAuth = false;
      req.session.user = null;
      req.session.user_id = null;
      req.session.isLoggedin = false;
      res.render("home", { msg: "User is Blocked" ,products});
    } else {
      next();
    }
  };

// image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // make sure directory exists
    if (!fs.existsSync("./uploads")) {
      fs.mkdirSync("./uploads");
    }
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    // remove spaces and special characters from original filename
    var originalname = file.originalname.replace(/[^a-zA-Z0-9]/g, "");
    // set filename to fieldname + current date + original filename
    cb(null, file.fieldname + "_" + Date.now() + "_" + originalname);
  },
});
var upload = multer({
  storage: storage,
}).single("image"); 




user_route.get("/home",isAuth,userStatus, user_controller.homeRoute);

user_route.get("/shop",isAuth,userStatus, user_controller.user_shop);
user_route.get("/filter_brand/:id",isAuth,userStatus, user_controller.userfilterBrand);

user_route.get("/cart",isAuth,userStatus, user_controller.getCart);

user_route.get("/product_details/:id",isAuth,userStatus, user_controller.getProductDetails);

user_route.get("/login",user_controller.getUserLogin )

user_route.get("/checkout/:id",isAuth,userStatus, user_controller.getCheckouts)

user_route.get("/contact",isAuth,userStatus, user_controller.contact)

user_route.post("/add_order/:id",isAuth,userStatus,user_controller.confirmation)
user_route.post('/redeem_coupon',isAuth,userStatus,user_controller.coupon)
user_route.post('/delete_coupon',isAuth,userStatus,user_controller.deletecoupon)


// user sign up

user_route.get("/user_signup",user_controller.getuser_signup )

user_route.get('/order/paypal_refund/:id',user_controller.paypal_refund)

//user sign into database

user_route.post("/user_signup", upload, user_controller.user_signup);

user_route.get("/login_with_otp", user_controller.user_login_with_otp);

user_route.post("/login", user_controller.user_login);

user_route.post("/sendOTP", user_controller.user_login_with_sendotp);
// user_route.post("/signup_sendOTP", user_controller.user_signup_with_sendotp);

user_route.post("/verifyOTP", user_controller.user_login_with_verifydotp);
user_route.post("/signverifyOTP", user_controller.user_sign_with_verifydotp);
user_route.get("/forget_password", user_controller.forget_password);
user_route.post(
  "/forget_password_sendOTP",
  user_controller.forget_password_send_otp
);

user_route.post(
  "/forget_password_verifyOTP",
  user_controller.forget_password_verify_otp
);

user_route.get("/otp", (req, res) => {
  res.render("user_otp");
});

user_route.get("/",async (req, res) => {
  const product=await product_models.find()
  res.render("home",{product});
});




user_route.post('/add_cart/:id',isAuth,userStatus, user_controller.product_to_cart)
user_route.get('/user_logout',user_controller.user_logout)




user_route.post('/productRemove',isAuth,userStatus,user_controller.productRemove)
// user_route.post('/updateProductStock',isAuth,userStatus,user_controller.updateProductStock)
user_route.post('/increaseQuantity',user_controller.updateQuantity)
user_route.post('/decreaseQuantity',user_controller.decrementQuantity)


user_route.get('/add_address',isAuth,userStatus,user_controller.getUserAddressDetails)
user_route.post('/add_address',user_controller.addUserAddressDetails)
user_route.get('/order_history',isAuth,userStatus,user_controller.orderHistory)

user_route.get('/order/cancel/:id',isAuth,userStatus,user_controller.orderCancell)
user_route.get('/order/refund/:id',isAuth,userStatus,user_controller.orderReturn)

user_route.get('/wallet',isAuth,userStatus,user_controller.getWallet)

user_route.get('/price_hightolow',isAuth,userStatus,user_controller.priceHighLow)
user_route.get('/product_sort',isAuth,userStatus,user_controller.productSort)
user_route.get('/category_sort',isAuth,userStatus,user_controller.pricelowToHigh)


// wishlist 

user_route.get('/paypal-success',user_controller.paypal_success)
user_route.get('/paypal-err',user_controller.paypal_err)

user_route.get('/filter',user_controller.filterProduct)
user_route.get('/user_product_search',user_controller.userproduct_search)





 
 user_route.get('/user_profile',user_controller.userProfile)

 user_route.get('/user_profile_update/:id',user_controller.userEditProfile)
 user_route.post('/update_userProfile/:id',upload,user_controller.userUpdatetProfile)
 user_route.get('/user_order_details/:id',user_controller.userOrderDetails)


 user_route.get('/user_order_invoice/:id',user_controller.invoice)
 user_route.post('/wallet_buy',user_controller.wallet_buy)
 user_route.post('/wallet_delete',user_controller.wallet_delete)

 user_route.get('/cart_empty',user_controller.carEmpty)


module.exports = user_route;
