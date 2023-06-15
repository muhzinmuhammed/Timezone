require("dotenv").config();


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId  =process.env.TWILIO_SERVICESID
const client = require("twilio")(accountSid, authToken);
const ITEMS_PER_PAGE = 4
const paypal=require('paypal-rest-sdk')

const coupon_model=require('../models/coupon_model')

const pdf = require('html-pdf');

const ejs = require('ejs');
const path = require('path');

const banner_model=require('../models/banner_model')

const express = require("express");
const user_route = express.Router();

const multer = require("multer");

const bcrypt = require("bcrypt");

const product_model = require("../models/product_models");

const cart_model=require('../models/cart_model')





const order_model=require('../models/order_model')



const fs = require("fs");
const users_models = require("../models/users_models");


const wallet_model = require("../models/wallet_model");
const category_model = require("../models/category_model");
const brand_model = require("../models/brand_model");


user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

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

exports.homeRoute = async (req, res) => {
  const products = await product_model.find().limit(6).where({product_status:true});

  const category=await category_model.find()

  console.log(category);

  const user=req.session.username;
   
  const user_id=req.session.user_id

  const banner=await banner_model.find().where({baner_status:true})

  console.log(banner);

  res.render("index", { products,user,user_id,category,banner });
};

exports.user_shop = async (req, res) => {
  try {
    const currentPage = parseInt(req.query.page) || 1; // Get the current page number from query parameters (default: 1)

    const count = await product_model.countDocuments().where({ product_status: true }); // Count the total number of products
    const totalPages = Math.ceil(count / ITEMS_PER_PAGE); // Calculate the total number of pages

    const product = await product_model.find()
      .where({ product_status: true })
      .skip((currentPage - 1) * ITEMS_PER_PAGE) // Skip the appropriate number of products based on the current page
      .limit(ITEMS_PER_PAGE) // Limit the number of products per page
      .exec();

    const user = req.session.username;
    const user_id = req.session.user_id;
    const category = await category_model.find();
    const brand = await brand_model.find();

    res.render("shop", {
      product,
      user,
      user_id,
      category,
    
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal server error" });
  }
};

exports.userfilterBrand = async (req, res) => {
  try {
    const user = req.session.username;
    const user_id = req.session.user_id;
    const category = await category_model.find();
    const currentPage = parseInt(req.query.page) || 1; // Get the current page number from query parameters (default: 1)

    const count = await product_model.countDocuments().where({ product_status: true }); // Count the total number of products
    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);


    const id = req.params.id;
   
    const categori = await category_model.findOne({ _id: id });
    
    const product = await product_model.find({ category: categori}).where({ product_status: true }).skip((currentPage - 1) * ITEMS_PER_PAGE) // Skip the appropriate number of products based on the current page
      .limit(ITEMS_PER_PAGE) // Limit the number of products per page
      .exec();

   

    res.render("shop", { product, user, user_id, category,currentPage,totalPages });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal server error" });
  }
};


exports.user_signup = async (req, res) => {
  const phone = req.body.phone;

  const existingUser = await users_models.findOne({ phone: phone });

  if (existingUser) {
    return res.render("user_signup", { name: "Already exists" });
  }

  const saltRounds = 10;
  const plainTextPassword = req.body.password;

  try {
    const hashedPassword = await new Promise((resolve, reject) => {
      bcrypt.hash(plainTextPassword, saltRounds, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });

    const user = ({
      name: req.body.name,
      email: req.body.email,
      phone: phone,
      password: hashedPassword,
    });

    req.session.phone = phone;
   
    req.session.user = user;

    try {
      const otpResponse = await client.verify.v2
        .services(serviceId)
        .verifications.create({
          to: "+91" + phone,
          channel: "sms",
        });
      res.render("sign_with_otp_verify", { msg: "OTP sent successfully" });
    } catch (error) {
      res
        .status(error?.status || 400)
        .send(error?.message || "Something went wrong!");
    }
  } catch (error) {
    res.status(500).send({ message: "Error occurred while hashing password" });
  }
};



exports.user_login = async (req, res) => {
  const phone = req.body.phone;

  const password = req.body.password;

  try {
    const user = await users_models.findOne({ phone: phone });

   
  
   
    

    if (user.isBlocked) {
      res.render("login",{message:'User Is Blocked'});
      return;
    }
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        req.session.isAuth=true
        req.session.username=user.name
        req.session.user_id=user.id
        res.redirect("/home");
      } else {
        res.render('login',{wrong:"Please correct your password"});
      }
    }else{
      res.redirect('/login')
    }
  } catch (error) {
    console.error(error);
    res.send("An error occurred while logging in.");
  }
};

exports.user_login_with_otp = (req, res) => {
  res.render("login_with_otp");
};
exports.user_login_with_sendotp = async (req, res) => {
  const phone = req.body.phone;

  const existingUser = await users_models.findOne({ phone: phone });

  if (!existingUser) {
    // If the user does not exist, render the signup template
    return res.render("login_with_otp_verify", { not_found: "User not found" });
  }

  req.session.phone = phone;
  try {
    const otpResponse = await client.verify.v2
      .services(serviceId)
      .verifications.create({
        to: "+91" + phone,
        channel: "sms",
      });
    res.render("login_with_otp_verify", { msg: "otp send successfully" });
  } catch (error) {
    res
      .status(error?.status || 400)
      .send(error?.message || "Something went wrong!");
  }
};


exports.user_login_with_verifydotp = async (req, res) => {
  
  const verificationCode = req.body.otp;

  const phoneNumber = req.session.phone;
  const user = await users_models.findOne({ phone :phoneNumber });



  if (!phoneNumber) {
    res.status(400).send({ message: "Phone number is required" });
    return;
  }

  try {
    // Verify the SMS code entered by the user
    const verification_check = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({
        to: "+91" + phoneNumber,
        code: verificationCode,
      });

    if (verification_check.status === "approved") {
      // If the verification is successful, do something
      const products = await product_model.find().where({product_status:true});
      req.session.isAuth=true
        req.session.username=user.name
        req.session.user_id=user.id
        res.redirect("/home");
    } else {
      // If the verification fails, return an error message
      res.render("login_with_otp", { message: "Invalid verification code" });
    }
  } catch (err) {
    res
      .status(500)
      .send({
        message: err.message || "Some error occurred while verifying the code",
      });
  }
};
exports.user_sign_with_verifydotp = async (req, res) => {
  const verificationCode = req.body.otp;
  const phoneNumber = req.session.phone;
  const user = req.session.user;


  if (!phoneNumber) {
    res.status(400).send({ message: "Phone number is required" });
    return;
  }

  try {
    // Verify the SMS code entered by the user
    const verification_check = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({
        to: "+91" + phoneNumber,
        code: verificationCode,
      });

    if (verification_check.status === "approved") {
      // If the verification is successful, do something
      
       const user_detail=new users_models({
       ...user
       }) // Save the user object, not userdetails
  await user_detail.save()
      req.session.isAuth = true;
      req.session.username = user.name;
      req.session.user_id = user.id;
      res.redirect("/home");
    } else {
      // If the verification fails, return an error message
      res.render("login_with_otp", { message: "Invalid verification code" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while verifying the code",
    });
  }
};

exports.forget_password = (req, res) => {
  res.render("forgetpassword");
};

exports.forget_password_send_otp = async (req, res) => {
  const { phone } = req.body;
  req.session.phone = phone;
  try {
    const otpResponse = await client.verify.v2
      .services(serviceId)
      .verifications.create({
        to: "+91" + phone,
        channel: "sms",
      });
    res.render("forgetpassword", { msg: "otp send successfully" });
  } catch (error) {
    res
      .status(error?.status || 400)
      .send(error?.message || "Something went wrong!");
  }
};

exports.forget_password_verify_otp = async (req, res) => {
  const verificationCode = req.body.otp;
  const phoneNumber = req.session.phone;
  const password = req.body.password;

  if (!phoneNumber) {
    res.status(400).send({ message: "Phone number is required" });
    return;
  }

  try {
    // Verify the SMS code entered by the user
    const verification_check = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({
        to: "+91" + phoneNumber,
        code: verificationCode,
      });

    if (verification_check.status === "approved") {
      // If the verification is successful, do something

      // res.render('home', { message: "Verification successful" });
      users_models.findOne({ phone: phoneNumber }).then((user) => {
        const saltRounds = 10; // You can adjust the number of salt rounds as needed
        bcrypt.hash(password, saltRounds, (err, hash) => {
          if (err) {
            res.status(500).send({
              message:
                err.message || "Some error occurred while hashing the password",
            });
          } else {
            users_models
              .findOneAndUpdate({ phone: phoneNumber }, { password: hash })
              .then((data) => {
                if (!data) {
                  res.status(404).send({
                    message: `Cannot update user with ID: ${phone}. User not found.`,
                  });
                } else {
                  res.render("login", {
                    message: "Successfully updated password",
                  });
                }
              })
              .catch((err) => {
                res
                  .status(500)
                  .send({ message: "Error updating user information" });
              });
          }
        });
      });
    } else {
      // If the verification fails, return an error message
      res.render("forgetpassword", { message: "Invalid verification code" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while verifying the code",
    });
  }
};




exports.getCart=async(req,res)=>{
  try {
     let userId=req.session.user_id
  let user=  req.session.username;

  
  let cart= await cart_model.findOne({user:userId}).populate(
    "products.productId"
  )
if (!cart||cart.products.length==0) {
  res.render('cart_empty',{user,userId})
  
}

  if (cart) {
    let products=cart.products

    if (!products) {
      res.send("hello")
      
    }
   
   
    

    res.render('cart',{user,products,userId})
  }
  }
  catch (err) {

    console.error(err);
    res.status(500).send('Server Error');
  }
}

exports.getProductDetails = async (req, res) => {

  const id = req.params.id;
  try {
    const product_image = await product_model.findById(id);
    console.log(product_image)
    const user=req.session.username;
     const user_id=req.session.user_id
     
    res.render('product_details', {product_image,user,user_id});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
exports.getUserLogin =async (req, res) => {
  const user=req.session.username;
   const user_id=req.session.user_id

  res.render("login",{user,user_id});
};



exports.getCheckouts = async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const user=req.session.username;
   const user_id=req.session.user_id
  const userSchema = await users_models.findById(user_id);
  const coupons = await coupon_model.find();
  console.log(user);
  const addressIndex = userSchema.address.findIndex((item) =>
  item._id.equals(id)

 
);




const specifiedAddress = userSchema.address[addressIndex];
  const cart = await cart_model
    .findOne({ user: user_id })
    .populate("products.productId");
    const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const product_price = product.product_price;
      if (!product_price) {
        throw new Error("Product price is required");
      }
      if (!product) {
        throw new Error("Product is required");
      }

      return {
        product: product._id,
        quantity: quantity,
        product_price: product_price,
      };

    })
    const coupon = await coupon_model.find();
    let couponfind = [];
    let discount=[]
  coupon.forEach((CouponItem) => {
    let couponExists = false;
    userSchema.coupon.forEach((usercoupon) => {
      if (usercoupon === CouponItem.code) {
        couponExists = true;
      }
    });

    if (!couponExists) {
      couponfind.push(CouponItem.code);
      discount.push(CouponItem.discount)
    }
  });
   

  res.render("checkout", { user, user_id, specifiedAddress, cart,couponfind,discount});
};

exports.contact=async(req,res)=>{
  const user=req.session.username;
   const user_id=req.session.user_id

  
  res.render("contact",{user,user_id});
}

let paypalTotal = 0;
exports.confirmation = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const user = req.session.username;
    const user_id = req.session.user_id;
    
   
    const payment_method = req.body.payment_method;

    
    

    const userSchema = await users_models.findById(user_id);
   

    const addressIndex = userSchema.address.findIndex((item) =>
      item._id.equals(id)
    );

    const specifiedAddress = userSchema.address[addressIndex];
    

    const cart = await cart_model
      .findOne({ user: user_id })
      .populate("products.productId");

      const discount=cart.total
     const wallet_discount=cart.wallet

    
     
      
      
    const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const price = product.product_price;
     

      if (!price) {
        throw new Error("Product price is required");
      }
      if (!product) {
        throw new Error("Product is required");
      }

      return {
        product: product._id,
        quantity: quantity,
        price: price,
      };
    });
    
      
    let totalPrice = 50;
    items.forEach((item) => {
      totalPrice += (item.price * item.quantity)

      
     
     
});


if (discount) {
  totalPrice -= discount;
}
let isWallet
if (wallet_discount!=totalPrice && wallet_discount>=0) {
  totalPrice -= wallet_discount;
  isWallet ='debit'
  
}
else{
  isWallet='nil'

}
   

 

    

    if (payment_method === "cod") {
     

      const order = new order_model({
        user: user_id,
        items: items,
        total: totalPrice,
        status: "Pending",
        isWallet,
        payment_method: payment_method,
        createdAt: new Date(),
        shipping_charge: 50,
        address: specifiedAddress,
      });

     

      
     
      await order.save();
      await cart.products.map(async (item) => {
        let stock = item.productId.product_stock - item.quantity;
  
        await product_model.findByIdAndUpdate(
          item.productId._id,
          {
            product_stock: stock,
          },
          { new: true }
        );
      });
      await cart_model.deleteOne({ user: user_id });
   
   

      res.render("confirmation", { user, user_id, specifiedAddress, cart,totalPrice });
  
    }

  else if (payment_method === "paypal") {
      let createPayment = {};

      const order = new order_model({
        user: user_id,
        items: items,
        total: totalPrice,
        status: "Pending",
        payment_method: payment_method,
        createdAt: new Date(),
        shipping_charge: 50,
        address: specifiedAddress,
      });

     

    
req.session.order=order

     

      
      cart.products.forEach((element) => {
        paypalTotal += totalPrice;
      });
      console.log(paypalTotal);

      createPayment = {
        intent: "sale",
        payer: { payment_method: "paypal" },
        redirect_urls: {
          return_url: "http://timez.site/paypal-success",
          cancel_url: "http://timez.site/paypal-err",
        },
        transactions: [
          {
            amount: {
              currency: "USD",
              total: (paypalTotal / 82).toFixed(2), // Divide by 82 to convert to USD
            },
            description: "Super User Paypal Payment",
          },
        ],
      };

      paypal.payment.create(createPayment, function (error, payment) {
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              res.redirect(payment.links[i].href);
            }
          }
        }
      });

     
    } else {
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    res.status(500).send({
      message:
        error.message ||
        "Some error occurred while creating a create operation",
    });
  }
};



exports.paypal_success= async(req,res)=>{

  const order=req.session.order
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const user = req.session.username;
    const user_id = req.session.user_id;

 
  
  

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
          "currency": "USD",
            "total": paypalTotal
        }
    }]
  };

  const order_details=new order_model({
    ...order
  })

  await order_details.save()
  await cart_model.deleteOne({ user: user_id })
  paypal.payment.execute(paymentId, execute_payment_json, function  (error, payment) {
    //When error occurs when due to non-existent transaction, throw an error else log the transaction details in the console then send a Success string reposponse to the user.

    

  if  (error)  {
      console.log(error.response);
      throw error;
  } else  {
    
   
     res.render("paypalSuccess",{payment,user, user_id,})
  }
});

}
exports.paypal_err=(req,res)=>{
  console.log(req.query);
  res.send("error")
}


exports.getuser_signup=(req,res)=>{
  res.render('user_signup')
}

exports.user_logout=(req,res)=>{
  req.session.isAuth=false;
  req.session.username=null;
  req.session.user_id=null;
  
  // Render the admin login page
  res.redirect('/');
}


exports.product_to_cart = async (req, res) => {
  try {
    const userId =  req.session.user_id;
   
    const productId = req.params.id;
   

    let userCart = await cart_model.findOne({ user: userId });

    if (!userCart) {
      // If the user's cart doesn't exist, create a new cart
      let discount=0
      const newCart = new cart_model({ user: userId, products: [],discount:discount });
      await newCart.save();
       userCart = newCart;
    }

    const productIndex = userCart?.products.findIndex(
      (product) => product.productId == productId
    );

    if (productIndex === -1) {
      // If the product is not in the cart, add it
      userCart.products.push({ productId, quantity: 1 });
    } else {
      // If the product is already in the cart, increase its quantity by 1
      userCart.products[productIndex].quantity += 1;
    }

 
    await userCart.save();

   
    res.redirect('/cart');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




exports.productRemove=async(req,res)=>{
  console.log('eivvedh');
  try {
    let {productId}=req.body
    let userId=req.session.user_id

    const userProduct=await product_model.findById(productId).select('product_price')
    console.log(userProduct);
    if(!userProduct){
      res.send({message:'product not found'})
    }
    const userCart=await cart_model.findOne({user:userId})

    
    
    const productCount=userCart.products.length-1
    if(userCart){
      const itemIndex=userCart.products.findIndex((item)=> item.productId.equals(productId))

      if(itemIndex>-1){
        userCart.products.splice(itemIndex,1)
        await userCart.save()
        res.json ({status:true,message:'product removed from cart',length:productCount})
      }else{
        res.json ({status:false,message:"product not found"})
      }
    }else{
      res.render('cart_empty');
    }
  
  } catch (error) {
    console.log(error);
  }
 }

exports.updateQuantity = async (req, res, next) => {
  const userId = req.session.user_id;
  const cartItemId = req.body.cartItemId;

  try {
    const cart = await cart_model.findOne({ user: userId }).populate("products.productId");
    const product = await product_model.findById({ _id: cartItemId });

    const cartIndex = cart.products.findIndex((item) => item.productId.equals(cartItemId));

    if (cartIndex === -1) {
      return res.json({ success: false, message: "Cart item not found." });
    }

    cart.products[cartIndex].quantity += 1;

    const products = cart.products[cartIndex].productId;
    const maxQuantity = products.product_stock;
    

    if (cart.products[cartIndex].quantity > maxQuantity) {
      return res.json({
        success: false,
        message: "Maximum quantity reached.",
        maxQuantity
      });
    }

    await cart.save();

    const total = cart.products[cartIndex].quantity * cart.products[cartIndex].productId.product_price;
    const quantity = cart.products[cartIndex].quantity;

    res.json({
      success: true,
      message: "Quantity updated successfully.",
      total: parseInt(total),
      quantity
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to update quantity." });
  }
};

exports.decrementQuantity=async(req,res,next)=>{
  const userId = req.session.user_id;
  const cartItemId = req.body.cartItemId;
  
 const product=await product_model.findById({_id:cartItemId})
  try {
    const cart = await cart_model.findOne({ user: userId }).populate("products.productId")
    console.log(cart,cartItemId);
 

    const cartIndex = cart.products.findIndex((item) => item.productId.equals(cartItemId));
     
    if (cartIndex === -1) {
      return res.json({ success: false, message: "Cart item not found." });
    }

    cart.products[cartIndex].quantity -= 1;
    await cart.save();

   
    // console.log(cart.product[cartIndex]);
    const total = cart.products[cartIndex].quantity* cart.products[cartIndex].productId.product_price;
    const quantity = cart.products[cartIndex].quantity;
   
   

    res.json({
      success: true,
      message: "Quantity updated successfully.",
      total,
      quantity,
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to update quantity." });
  }
}




exports.getUserAddressDetails = async (req, res) => {
  const user=req.session.username
  const userId = req.session.user_id;
 
  const address = await users_models.findById(userId)
  console.log(address);

  res.render("userAdressDetails", { user, userId,address});
};



exports.addUserAddressDetails=async(req,res)=>{
  const user_id =req.session.user_id;
  const user=req.session.username;

  const userSchema=await users_models.findById(user_id)




  if (userSchema) {
    const newAddress = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      address1: req.body.address1,
      address2: req.body.address2,
      town:req.body.town,
      postcode:req.body.postcode
    }

 

 
   
    const isAddressExist = userSchema.address.some(
      (address) => address.address1 === req.body.address1
    );

    if (isAddressExist) {
      res.redirect("/addadd_addressress_page");
    } else {
      userSchema.address.push(newAddress);




    try {
        await userSchema.save();

     
  
      
      res.redirect("/add_address");
    } catch (err) {
      res.send({
        message: err.message,
        type: "danger",
      });
    }
    
  }
}


}


exports.orderHistory = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = req.session.username;

    const orders = await order_model.find({ user: userId }).populate("items.product");


    res.render('order_history', { orders, userId, user });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while fetching the order history",
    });
  }
};


exports.orderCancell=async(req,res)=>{
  try {
    const { id } = req.params;

    console.log(id);

    // Update the user document with the provided id
    await order_model.updateOne({ _id: id }, { $set: { status: 'Cancel' } });

   
    
    res.redirect("/order_history");
  } catch (err) {
   
    res.redirect("/order_history");
  }
}

exports.orderReturn=async(req,res)=>{
  try {
    const { id } = req.params;

   const reason=req.query.reason

   console.log(reason,"a");

    // Update the user document with the provided id
    await order_model.updateMany({ _id: id }, { $set: { status: 'Return', reasonForCancel: reason } });


   
    
    res.redirect("/order_history");
  } catch (err) {
   
    res.redirect("/order_history");
  }
}


//wallet 


exports.getWallet = async (req, res) => {
  const userId = req.session.user_id;
  const user = req.session.username;
  
  try {
    const orders = await order_model.find({ user: userId }).where({ $or: [{ isWallet: 'credit' }, { isWallet: 'debit' }] });


console.log(orders);
   
     
      let sum=0
    
    const wallet_data = await wallet_model.find({ userId: userId }).populate('orderId')
    
    for (let i = 0; i < wallet_data.length; i++) {

     sum+=wallet_data[i].balance


     

  
    }

    
 
  
    res.render('wallet',{sum,userId,user,orders})
    
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while retrieving wallet data' });
  }
};

exports.priceHighLow=async(req,res)=>{
  const user=req.session.username;
  const user_id=req.session.user_id
  const currentPage = parseInt(req.query.page) || 1
  const count = await product_model.countDocuments().where({ product_status: true }); // Count the total number of products
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
  const category=await category_model.find()
 const product=await product_model.find().where({product_status:true}).skip((currentPage - 1) * ITEMS_PER_PAGE) // Skip the appropriate number of products based on the current page
 .limit(ITEMS_PER_PAGE).sort({ product_price: -1 }) // Sort by price in ascending order
  
  
  res.render("shop", { product,user,user_id,category,totalPages,currentPage });
    // Do something with the sorted products

}
exports.productSort=async(req,res)=>{
  const user=req.session.username;
  const user_id=req.session.user_id

  const currentPage = parseInt(req.query.page) || 1
  const count = await product_model.countDocuments().where({ product_status: true }); // Count the total number of products
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  const product=await product_model.find().where({product_status:true}).skip((currentPage - 1) * ITEMS_PER_PAGE) // Skip the appropriate number of products based on the current page
  .limit(ITEMS_PER_PAGE).sort({ product_name: 1 }) // Sort by price in ascending order
  const category=await category_model.find()

  res.render("shop", { product,user,user_id,category,totalPages,currentPage });
    // Do something with the sorted products

}
exports.pricelowToHigh=async(req,res)=>{
  const user=req.session.username;
  const user_id=req.session.user_id
  const currentPage = parseInt(req.query.page) || 1
  const count = await product_model.countDocuments().where({ product_status: true }); // Count the total number of products
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
  const category=await category_model.find()
  const product=await product_model.find().where({product_status:true}).skip((currentPage - 1) * ITEMS_PER_PAGE) // Skip the appropriate number of products based on the current page
  .limit(ITEMS_PER_PAGE).sort({ product_price: 1 }) // Sort by price in ascending order
  
  

  res.render("shop", { product,user,user_id,category,currentPage,totalPages });
    // Do something with the sorted products

}






exports.filterProduct = async (req, res) => {
  try {
    const user=req.session.username;
    const user_id=req.session.user_id
    const currentPage = parseInt(req.query.page) || 1; // Get the current page number from query parameters (default: 1)

    const count = await product_model.countDocuments().where({ product_status: true }); // Count the total number of products
    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    const category=await category_model.find()
 
  
    const { minPrice, maxPrice } = req.query

    let filteredProducts = product_model.find()

  

    if (minPrice && maxPrice) {
      filteredProducts = filteredProducts.where('product_price').gte(minPrice).lte(maxPrice)
    } else if (minPrice) {
      filteredProducts = filteredProducts.where('product_price').gte(minPrice)
    } else if (maxPrice) {
      filteredProducts = filteredProducts.where('product_price').lte(maxPrice)
    }

    const product = await filteredProducts.where({ product_status: true })
    .skip((currentPage - 1) * ITEMS_PER_PAGE) // Skip the appropriate number of products based on the current page
    .limit(ITEMS_PER_PAGE) // Limit the number of products per page
      .exec();

    res.render("shop", { product,user,user_id,category,currentPage,totalPages });
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'Internal server error' })
  }
}



exports.userproduct_search = async (req, res) => {
  const user=req.session.username;
  const user_id=req.session.user_id

  try {
    const query = req.query.name;
    // Get the search query from the URL query parameters

    const category=await category_model.find()
    const product  = await product_model.find({ product_name: { $regex: new RegExp(query, 'i') } }).populate('category')
    res.render('shop', { product,user,user_id,category  });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}

// app.js or your main server file
// Server-side code (user_controller.js)











exports.coupon = async (req, res) => {
  const  coupon  = req.body.coupon;


  
  const user_id=req.session.user_id

  const couponFind = await coupon_model.findOne({ code: coupon });
  
  const userCoupon = await users_models.findById(user_id);

  if (userCoupon.coupon.includes(coupon)) {
    return res.json({
      success: false,
      message: 'Coupon Already used'
    });
  }

  userCoupon.coupon.push(coupon);
  await userCoupon.save();

  if (!couponFind || couponFind.status === false) {
    return res.json({
      success: false,
      message: couponFind ? 'Coupon Deactivated' : 'Coupon not found'
    });
  }

  const currentDate = new Date();
  const expirationDate = new Date(couponFind.createdAt);

  if (currentDate > expirationDate) {
    return res.json({
      success: false,
      message: 'Coupon Expired'
    });
  }

  const amount = couponFind.discount;
  console.log(amount);

  res.json({
    success: true,
    message: 'Coupon available',
    couponFind,
    amount: parseInt(amount)
  });
  

  try {
    
    const cart = await cart_model.findOne({user:user_id})
 
   cart.total=amount
   
    if (!cart) {
console.log("Cart not found");
      return; // or throw an error
    }
  
    cart.total = amount;
   
    await cart.save();

  } catch (error) {
    console.error("Error updating cart:", error);
    // handle the error appropriately
  }

  

};

exports.deletecoupon=async(req,res)=>{
  
}

// user profile 
exports.userProfile=async (req,res)=>{
  const user=req.session.username;
  const user_id=req.session.user_id

  const userprofile = await users_models.findOne({ _id: user_id });
 console.log(userprofile);

  res.render('userprofile',{user,user_id,userprofile})

}
exports.userEditProfile=async (req,res)=>{
try{
  const user=req.session.username;
  const user_id=req.session.user_id

  const {id}=req.params
  
  let userdetails = await users_models.findById(id);
  
  if (userdetails == null) {
    res.redirect('/user_profile');
  } else {
    res.render("user_edit", { title: "Edit page", userdetails: userdetails,user,user_id });
  }
  
} catch (err) {
  res.redirect('/user_profile');
  console.log(err); // log the error for debugging purposes
}

  

}

exports.userUpdatetProfile=(req,res)=>{
  let { id } = req.params;
 
  
  let new_image = [];
  if (req.file) {
    new_image = req.file.filename;
    try {
      fs.unlinkSync("./uploads/" + req.body.image);
    } catch (error) {
      console.log(error);
    }
  } else {
    new_image = req.body.image;
  }
  users_models.findByIdAndUpdate(id, {
      name: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      gender:req.body.gender,
      image: new_image,
    })
    
    .then((result) => {
      
      res.redirect("/user_profile");
    })
    .catch((error) => {
      res.send(error);
    });
}
exports.userOrderDetails = async (req, res) => {

  try {

    const user=req.session.username;
  const user_id=req.session.user_id
  const { id } = req.params;

  const orders = await order_model
    .findById(id)
    .populate({ path: "items.product" });

  res.render("user_order_details", { orders,user,user_id });
    
  } catch (error) {

    console.log(error);
    
  }
  
};

exports.invoice = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = req.session.user_id;
    const user = req.session.username;

    const order = await order_model
      .findById(id)
      .populate("items.product");

      

    if (!order) {
      return res.status(404).send({
        message: "Order not found",
      });
    }

    const products = order.items.map((item) => {
      const { product_name, product_price, product_stock } = item.product;
      return {
        product_name,
        product_price,
        product_stock,
      };
    });

   

    res.render('invoice', { order, userId, user, products });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while fetching the order history",
    });
  }
};


exports.wallet_buy = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = req.session.username;

    const wallet = await wallet_model.findOne({ userId: userId });
    
    const cart = await cart_model.findOne({ user: userId }).populate("products.productId");
  
    let totalPrice = 0;
    const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const price = item.productId.product_price;
     
     
      totalPrice += price * quantity;
      
     
    });

  

    
  
    const balance = (10 / 100) * totalPrice;

    
  
 let   wallet_balance=wallet.balance
    if (balance <  wallet.balance) {
      totalPrice -= balance;
      totalPrice += 50;
      cart.wallet = balance;
      await cart.save();
    
      
      wallet.balance-=balance
      await wallet.save();

      console.log(wallet.balance);
      
    }

    res.json({
      success: true,
      message: "Wallet add Successful",
      totalPrice,
      wallet_balance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.wallet_delete = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = req.session.username;

    const wallet = await wallet_model.findOne({ userId: userId });
    
    const cart = await cart_model.findOne({ user: userId }).populate("products.productId");
  
    let totalPrice = 0;
    const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const price = item.productId.product_price;
     
     
      totalPrice += price * quantity;
      
     
    });

    

    var wallet_balance = wallet.balance;

    
  
    const balance = (10 / 100) * totalPrice;
   

      totalPrice += 50;
      
      cart.wallet = totalPrice;
      
      await cart.save();
     
  
    wallet.balance+=balance
     
      await wallet.save();
    

    res.json({
      success: true,
      message: "Wallet remove Successful",
      totalPrice,
      wallet_balance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.carEmpty=(req,res)=>{
  const userId = req.session.user_id;
  const user = req.session.username;
  res.render('cart_empty',{user,userId})
}