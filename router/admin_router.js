const express = require("express");
const admin_route = express.Router();

const admin_controller = require("../controller/admin_controller");






const category_model = require("../models/category_model");


const multer = require("multer");
const fs = require("fs");
const brand_model = require("../models/brand_model");



const isAuth=(req,res,next)=>{

  if(req.session.isAuth){
    next()
  }
  else{
    res.redirect('/admin_login')
  }


}

// Middleware for parsing request bodies
admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

// Route for rendering the 'admin_index' view

admin_route.get("/admin_dashboard", isAuth,admin_controller.adminDashboard);

admin_route.post("/admin_login",admin_controller.adminLogin )

admin_route.get("/admin_login",admin_controller.getLoginAdmin )

admin_route.get("/add_product", async (req, res) => {
  const category = await category_model.find().exec();
  const brand = await brand_model.find().exec();
  res.render("add_product", { category,brand });
});

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
}).array('image',10)

// insert a product into the database
admin_route.post("/add_product",isAuth, upload,admin_controller.add_product);

//get all product

admin_route.get("/product_tables",isAuth, admin_controller.find_product)

// edit prodcut

admin_route.get("/edit/:id",isAuth,admin_controller.edit_product);

//update product

admin_route.post("/update/:id",isAuth, upload, admin_controller.update_product)

// delet product

admin_route.get("/delete/:id",isAuth, admin_controller.delete_product )

admin_route.get("/add_category", isAuth,(req, res) => {
  res.render("add_category");
});

// insert a user into the database
admin_route.post("/add_category",isAuth, admin_controller.add_category);

//get all product

admin_route.get("/category_tables",isAuth, admin_controller.get_all_category);

// edit prodcut

admin_route.get("/edit_category/:id",isAuth, admin_controller.edit_category);

//update product

admin_route.post(
  "/update_category/:id",isAuth,
  upload,
  admin_controller.update_category
);

// delet product

admin_route.get("/delete_category/:id",isAuth, admin_controller.delete_category);

//block
admin_route.post("/product/list/:id",isAuth, admin_controller.listProduct)


//unblock
admin_route.post("/product/unlist/:id",isAuth,admin_controller.unlistProduct )


//banner list

admin_route.post("/banner_list/:id",isAuth, admin_controller.listbanner)
admin_route.post("/banner/unlist/:id",isAuth, admin_controller.unlistBanner)




// product search
admin_route.get('/search', admin_controller.product_search);

/// add users

admin_route.get("/add_user",isAuth, (req, res) => {
  res.render("add_user");
});


// get all users

admin_route.get("/users_tables", isAuth,admin_controller.find_users);
admin_route.get("/order", isAuth,admin_controller.orderDetails);

// edit user



//update user



// delet user



//block
admin_route.post("/users/block/:id", admin_controller.block_users)

//unblock
admin_route.post("/users/unblock/:id",admin_controller.unblock_user )


admin_route.get('/logout',admin_controller.admin_login)
admin_route.get('/category_search',admin_controller.category_search)
admin_route.get('/user_search',admin_controller.user_search)
admin_route.get('/order_search',admin_controller.order_serach)


// sort product

admin_route.get('/products_sort',admin_controller.productSort)

admin_route.get('/coupon',admin_controller.getCoupon)

admin_route.get('/add_coupon',admin_controller.addGetCoupon)
admin_route.post('/add_coupon',admin_controller.addCoupon)
// update order status
 admin_route.post('/order/update/:id',admin_controller.orderUpdate)
 admin_route.get('/order_details/:id',admin_controller.userOrderDetails)
 admin_route.get('/order/admin_refund/:id',admin_controller.userRefund)

 admin_route.get('/brand_tables',isAuth,admin_controller.getBrand)
 admin_route.get('/date_filter',isAuth,admin_controller.filterDate)


 admin_route.get('/add_brand',admin_controller.getaddBrand)
 admin_route.post('/add_brand',admin_controller.addBrand)
admin_route.post('/couponInActive/:id',admin_controller.couponActive)
admin_route.post('/couponActive/:id',admin_controller.couponInActive)

admin_route.get('/banner',admin_controller.bannerPage)
admin_route.get('/add_banner',admin_controller.getaddbannerPage)
admin_route.post('/add_banner',isAuth,upload, admin_controller.addbanner)

admin_route.get('/edit_banner/:id',isAuth,admin_controller.editbanner)
admin_route.post('/update_banner/:id',isAuth,upload,admin_controller.updatebanner)




module.exports = admin_route;
