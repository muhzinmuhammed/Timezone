const category_model = require("../models/category_model");
const user_model = require("../models/users_models");
const product_model = require("../models/product_models");
const multer = require("multer");



const { startOfMonth: start, endOfMonth } = require("date-fns");
const fs = require("fs");

const sharp = require("sharp");
const admin_models = require("../models/admin_model");

const order_model = require("../models/order_model");

const wallet_model = require("../models/wallet_model");

const banner_model=require('../models/banner_model')

const bcrypt = require("bcryptjs");

const coupon_model = require("../models/coupon_model");

const brand_model = require("../models/brand_model");

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

// admin dashboard

exports.adminDashboard = async (req, res) => {
  if (req.session.isAuth) {
    try {
      console
      const startDate = start(new Date());
      const endDate = endOfMonth(new Date());
      const totalRevenue = await order_model.aggregate([
        {
          $match: {
            status: "Delivered",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
      ]);

      const salesData = await order_model.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: "Delivered", // Consider only delivered orders for sales data
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 },
          },
        },
      ]);
     

      // Format sales data into an object with month abbreviations as keys
      const formattedSalesData = {};
      let months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      var monthAbbreviation;
      salesData.forEach((item) => {
        monthAbbreviation = new Date(0, item._id - 1).toLocaleString(
          "default",
          { month: "short" }
        );
        formattedSalesData[monthAbbreviation] = item.count;
      });
     
      let monthlySales = {}
      months.map((month) => {
        if(formattedSalesData[month]){
          monthlySales[month] = formattedSalesData[month]
        } else {
          monthlySales[month] = 0
        }
      });

     
    

      const orders = await order_model
        .find({
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .populate("user")
        .populate("items.product");
      // Other calculations for order status counts
      let deliveredCounts = 0;
      let placedCounts = 0;
      let cancelledCounts = 0;
      let returnCounts = 0;
      orders.forEach((order) => {
        if (order.status === "Delivered") {
          deliveredCounts++;
        } else if (order.status === "Pending") {
          placedCounts++;
        } else if (order.status === "Cancell") {
          cancelledCounts++;
        } else if (order.status === "Refund") {
          returnCounts++;
        }
      });

      const data = {
        deliveredCounts,
        placedCounts,
        cancelledCounts,
        returnCounts,
      };
      const userCount = await user_model.countDocuments({});
      const ordersCount = await order_model.countDocuments({});
      const ordertable = await order_model
        .find()
        .where({ status: "Delivered" })
        .populate("user");

        console.log(ordertable  );

      res.render("admin_index", {
        totalRevenue,
        userCount,
        ordersCount,
        ordertable,
        data,
        monthlySales,
        monthAbbreviation,
      });
    } catch (error) {
      console.error("Error:", error);
      res.render("admin_login");
    }
  } else {
    res.render("admin_login");
  }
};

//admin login
exports.adminLogin = async (req, res) => {
  const email = req.body.email;

  const password = req.body.password;

  try {
    const user = await admin_models.findOne({ email: email });

    if (!user) {
      res.render("admin_login", { alert: "Invalid entry" });
      return;
    }

    const isMatch = await admin_models.findOne({ password: password });

    if (isMatch) {
      if (user) {
        req.session.isAuth = true;
        res.redirect("/admin_dashboard");
      }
    } else {
      res.render("admin_login", { message: "Invalid entry" });
    }
  } catch (error) {
    console.error(error);
    res.send("An error occurred while logging in.");
  }
};

exports.getLoginAdmin = (req, res) => {
  res.render("admin_login");
};

// add_category

exports.add_category = async (req, res) => {
  try {
    // Upload image first
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred during upload
        return res.send({
          message: err.message,
          type: "danger",
        });
      } else if (err) {
        // An unknown error occurred during upload
        return res.send({
          message: err.message,
          type: "danger",
        });
      }

      // Create new category with uploaded image data
      const user = new category_model({
        category_name: req.body.category_name,
        image: req.file.filename,
      });
      const existingCategory = await category_model.findOne({
        category_name: { $regex: new RegExp('^' + req.body.category_name + '$', 'i') },
      });
      

      if (existingCategory) {
        return res.render("add_category", { name: "Alredy exits" });
      }

      await user.save();
      const category = await category_model.find();

      return res.redirect("/category_tables");
    });
  } catch (err) {
    console.log(err);
  }
};
// find all ctegory
exports.get_all_category = async (req, res) => {
  try {
    const category = await category_model.find().exec();
    3;

    res.render("category_table", {
      title: "Home page",
      category: category,
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};

exports.edit_category = async (req, res) => {
  try {
    let { id } = req.params;
    let category = await category_model.findById(id);
    if (category == null) {
      res.redirect("/category_tables");
    } else {
      res.render("edit_category", { title: "Edit page", category: category });
    }
  } catch (err) {
    res.redirect("/category_tables");
    console.log(err); // log the error for debugging purposes
  }
};

//update category

exports.update_category = async (req, res) => {
  let { id } = req.params;
  let new_image = "";
  if (req.file) {
    new_image = req.file.filename;
    try {
      fs.unlinkSync("./uploads/" + req.body.image); // Delete the old image file
    } catch (error) {
      console.log(error);
    }
  } else {
    new_image = req.body.image;
  }

  try {
    await category_model.findByIdAndUpdate(id, {
      category_name: req.body.category_name,
      image: new_image,
    });

    const category = await category_model.find();
    return res.render("category_table", {
      message: "Category edited successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

//delete category
exports.delete_category = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await category_model.findByIdAndRemove(id);

    if (result) {
      // Check if user was found and removed
      if (result.image !== "") {
        fs.unlinkSync("./uploads/" + result.image);
      }

      res.redirect("/category_tables");
    } else {
      res.redirect("/category_tables");
    }
  } catch (err) {
    res.status(500).send(err.message); // Send error response with status code 500
  }
};

//

// add user



// find all user

exports.find_users = async (req, res) => {
  try {
    const user = await user_model.find().exec();
    req.session.message = {
      type: "success",
      message: "User added successfully",
    };

    res.render("users_table", {
      title: "Home page",
      user: user,
      message: req.session.message,
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};

// edit users



// update users



//delet_users


// user block

exports.block_users = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the user document with the provided id
    await user_model.updateOne({ _id: id }, { $set: { isBlocked: true } });

    res.redirect("/users_tables");
  } catch (err) {
    res.redirect("/users_tables");
  }
};

exports.unblock_user = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the user document with the provided id to set isBlocked to false
    await user_model.updateOne({ _id: id }, { $set: { isBlocked: false } });

    res.redirect("/users_tables");
  } catch (err) {}
};

//add product

exports.add_product = async (req, res) => {

  try {
    
    const user = new product_model({
      product_name: req.body.product_name,
      product_price: req.body.product_price,
      category: req.body.category,
      product_brand: req.body.brand,
      product_description: req.body.description,
      product_stock: req.body.stock,

  
    });
    const croppedImages = [];
    for (const file of req.files) {
      const croppedImage = `cropped_${file.filename}`;

      await sharp(file.path)
        .resize(500, 600, { fit: "cover" })
        .toFile(`uploads/${croppedImage}`);

      croppedImages.push(croppedImage);
    }

user.image=croppedImages
    await user.save();
    const product_data = await product_model
      .find()
      .populate("category")
      .populate("product_brand");

    res.render("product_table", {
      successMessage: "product add success full",
      product_data,
    });
  } catch (err) {
    console.log(err.message);
    res.send({
      message: err.message,
      type: "danger",
    });
  }
};

// find product

exports.find_product = async (req, res) => {
  const product_data = await product_model
    .find()
    .populate("category")
    .populate("product_brand");

  

  try {
    res.render("product_table", {
      product_data: product_data,
    });
  } catch (error) {
    console.error(error);
    res.send({ message: error.message });
  }
};

// edit prodcut

exports.edit_product = async (req, res) => {
  try {
    const { id } = req.params;
   

    const user = await product_model
      .findById(id)
      .populate("category")
      .populate("product_brand");

    const categoryName = user.category.category_name;

    const brandName = user.product_brand.brand;

    if (!user) {
      return res.redirect("/product_tables");
    }

    const category = await category_model.find();
    const brand = await brand_model.find();
    return res.render("edit_product", {
      user,
      category,
      categoryName,
      brand,
      brandName,
    });
  } catch (err) {
    console.error(err);
    return res.redirect("/product_tables");
  }
};

//update product

exports.update_product = async (req, res) => {
  try {
    const { id } = req.params;

    let new_images = [];
    if (req.files && req.files.length > 0) {
      new_images = req.files.map((file) => file.filename);
      try {
        // req.body.images.forEach((image) => {
        //   fs.unlinkSync("./uploads/" + image);
        // });
      } catch (error) {
        console.log(error);
      }
    } else {
      new_images = req.body.images;
    }

    // Convert category name to ObjectId
    const category = await category_model.findOne({
      category_name: req.body.category,
    });
    const categoryId = category ? category._id : null;

    const brand = await brand_model.findOne({ brand: req.body.brand });
    const brandId = brand ? brand._id : null;

    // Update the product using findByIdAndUpdate
    const updatedProduct = await product_model.findByIdAndUpdate(
      id,
      {
        product_name: req.body.product_name,
        product_price: req.body.product_price,
        category: categoryId,
        product_brand: brandId,
        product_stock: req.body.stock,
        product_description: req.body.description,
        image: new_images,
      },
      { new: true }
    );

    // Set { new: true } to return the updated document
    const product_data = await product_model
      .find()
      .populate("category")
      .populate("product_brand");
    if (updatedProduct) {
      return res.redirect("/product_tables");
    } else {
      res.redirect("/product_tables");
    }
  } catch (error) {
    console.error(error);
    res.send(error);
  }
};

exports.delete_product = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await product_model.findByIdAndRemove(id);

    if (result) {
      // Check if user was found and removed
      if (result.image !== "") {
        fs.unlinkSync("./uploads/" + result.image);
      }
      req.session.message = {
        type: "info",
        message: "User deleted successfully",
      };
    } else {
      req.session.message = {
        type: "error",
        message: "User not found",
      };
    }
    res.redirect("/product_tables");
  } catch (err) {
    res.status(500).send(err.message); // Send error response with status code 500
  }
};

exports.product_search = async (req, res) => {
  try {
    const query = req.query.name;
    console.log(query); // Get the search query from the URL query parameters
    const product_data = await product_model
      .find({ product_name: { $regex: new RegExp(query, "i") } })
      .populate("category");
    res.render("product_table", { product_data });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.unlistProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the user document with the provided id
    await product_model.updateOne(
      { _id: id },
      { $set: { product_status: true } }
    );

    

    res.redirect("/product_tables");
  } catch (err) {
   
    res.redirect("/product_tables");
  }
};

exports.listProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the user document with the provided id
    await product_model.updateOne(
      { _id: id },
      { $set: { product_status: false } }
    );

    

    res.redirect("/product_tables");
  } catch (err) {
    
    res.redirect("/product_tables");
  }
};
exports.listbanner = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id,"ll");

    // Update the user document with the provided id
    await banner_model.updateOne(
      { _id: id },
      { $set: { baner_status: false } }
    );

   

    res.redirect("/banner");
  } catch (err) {
    
    res.redirect("/banner");
  }
};
exports.unlistBanner = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id,"ll");

    // Update the user document with the provided id
    await banner_model.updateOne(
      { _id: id },
      { $set: { baner_status: true } }
    );

   

    res.redirect("/banner");
  } catch (err) {
    
    res.redirect("/banner");
  }
};

exports.admin_login = (req, res) => {
  // Destroy the current session if it exists to log out any previous user
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Render the admin login page
  res.render("admin_login");
};

exports.orderDetails = async (req, res) => {
  const orders = await order_model
    .find()
    .populate({ path: "items.product" })
    .populate("address")
    .populate({ path: "user" });

  res.render("admin_order", { orders });
};

exports.category_search = async (req, res) => {
  try {
    const query = req.query.name; // Get the search query from the URL query parameters
    const category = await category_model.find({
      category_name: { $regex: new RegExp(query, "i") },
    });
    res.render("category_table", { category });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
exports.user_search = async (req, res) => {
  try {
    const query = req.query.name; // Get the search query from the URL query parameters
    const user = await user_model.find({
      name: { $regex: new RegExp(query, "i") },
    });
    res.render("users_table", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};
exports.order_serach = async (req, res) => {
  try {
    const query = req.query.name; // Get the search query from the URL query parameters
    const order_data = await order_model.find({
      user: { $regex: new RegExp(query, "i") },
    });
    res.redirect("order", { order_data });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

exports.productSort = async (req, res) => {
  try {
    let sortCriteria = {};

    // Check if sorting by name is requested
    if (req.query.sortBy === "name") {
      sortCriteria.product_name = req.query.sortOrder === "asc" ? 1 : -1;
    }

    // Check if sorting by price is requested
    if (req.query.sortBy === "price") {
      sortCriteria.product_price = req.query.sortOrder === "asc" ? 1 : -1;
    }

    // Check if sorting by category is requested
    if (req.query.sortBy === "category") {
      sortCriteria.category = req.query.sortOrder === "asc" ? 1 : -1;
    }

    // Retrieve products and apply sorting criteria
    const sortedProducts = await product_model.find().sort(sortCriteria);
    res.render("products_table", {
      products: sortedProducts,
      sortOrder: req.query.sortOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.orderUpdate = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(orderId);
    const newStatus = req.body.status;
if (newStatus=="Delivered") {
  console.log("hai");
  await order_model.findByIdAndUpdate(orderId, { delivered_date:  Date.now(),status: newStatus });
}else{
  await order_model.findByIdAndUpdate(orderId, { status: newStatus });

}
    // Update the order using findByIdAndUpdate
   

    res.redirect("/order");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.userOrderDetails = async (req, res) => {
  const { id } = req.params;

  const orders = await order_model
    .findById(id)
    .populate({ path: "items.product" });
 
  res.render("admin_order_details", { orders });
};

exports.userRefund = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await order_model
      .findById(id)
      .populate({ path: "items.product" });

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const wallet = await wallet_model.findOne({ userId: order.user });

    if (wallet) {
      // User's wallet already exists, update the balance
      wallet.balance += order.total;
      wallet.transactions.push(order.payment_method);

      await wallet.save();
    } else {
      // User's wallet does not exist, create a new wallet
      const newWallet = new wallet_model({
        userId: order.user,
        orderId: order._id,
        balance: order.total,
        transactions: [order.payment_method],
      });

      await newWallet.save();
    }

    await order_model.updateOne({ _id: id }, { $set: { status: "Refund", isWallet: 'credit' } });


    res.redirect("/order");
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.getCoupon = async (req, res) => {
  const coupon = await coupon_model.find();
  res.render("adminCoupon", { coupon });
};
exports.addGetCoupon = async (req, res) => {
  res.render("addCoupon");
};

exports.addCoupon = async (req, res) => {
  const coupon = new coupon_model({
    code: req.body.coupon_code,
    discount: req.body.discount,
    description: req.body.description,
    createdAt: req.body.expire,
  });

  await coupon.save();
  res.redirect("/coupon");
};

// get brabd

exports.getBrand = async (req, res) => {
  const brand = await brand_model.find();
  console.log(brand,"brand");

  res.render("brand_table", { brand });
};
exports.getaddBrand = async (req, res) => {
  res.render("add_brand");
};
exports.addBrand = async (req, res) => {
  console.log(req.body.brand);
  const brand = new brand_model({
    brand: req.body.brand,
  });

  await brand.save();
  console.log(brand,"ll");

  res.redirect("/brand_tables");
};

exports.couponActive = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the user document with the provided id
    await coupon_model.updateOne({ _id: id }, { $set: { status: true } });

    req.session.message = {
      type: "info",
      message: "Product list message successfull ",
    };

    res.redirect("/coupon");
  } catch (err) {
    req.session.message = {
      type: "danger",
      message: "error",
    };
    res.redirect("/coupon");
  }
};
exports.couponInActive = async (req, res) => {
  try {
    const { id } = req.params;

    // Update the user document with the provided id
    await coupon_model.updateOne({ _id: id }, { $set: { status: false } });

    req.session.message = {
      type: "info",
      message: "Product list message successfull ",
    };

    res.redirect("/coupon");
  } catch (err) {
    req.session.message = {
      type: "danger",
      message: "error",
    };
    res.redirect("/coupon");
  }
};
exports.filterDate = async (req, res) => {
  try {
    const startDate = start(new Date());
    const endDate = endOfMonth(new Date());

    const salesData = await order_model.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "Delivered", // Consider only delivered orders for sales data
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Format sales data into an object with month abbreviations as keys
    const formattedSalesData = {};
    var monthAbbreviation;
    salesData.forEach((item) => {
      monthAbbreviation = new Date(0, item._id - 1).toLocaleString("default", {
        month: "short",
      });

      formattedSalesData[monthAbbreviation] = item.count;
    });

    const orders = await order_model
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .populate("user")
      .populate("items.product");
     
    // Other calculations for order status counts
    let deliveredCounts = 0;
    let placedCounts = 0;
    let cancelledCounts = 0;
    let returnCounts = 0;
    orders.forEach((order) => {
      if (order.status === "Delivered") {
        deliveredCounts++;
      } else if (order.status === "Pending") {
        placedCounts++;
      } else if (order.status === "Cancell") {
        cancelledCounts++;
      } else if (order.status === "Refund") {
        returnCounts++;
      }
    });

    const data = {
      deliveredCounts,
      placedCounts,
      cancelledCounts,
      returnCounts,
    };

    const { mindate, maxdate } = req.query;

   

   

    let filteredProducts = order_model.find();

    if (mindate && maxdate) {
      filteredProducts = filteredProducts
        .where("createdAt").where({status:"Delivered"})
        .gte(new Date(mindate))
        .lte(new Date(maxdate));
    } else if (mindate) {
      filteredProducts = filteredProducts
        .where("createdAt").where({status:"Delivered"})
        .gte(new Date(mindate));
    } else if (maxdate) {
      filteredProducts = filteredProducts
        .where("createdAt").where({status:"Delivered"})
        .lte(new Date(maxdate));
    }

    const ordertable = await filteredProducts.find().where({ status: "Delivered"}).populate("user")
    ;

    
       

    const totalRevenue = await order_model.aggregate([
      {
        $match: { status: "Delivered" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);
    // Format sales data into an object with month abbreviations as keys
    
    let months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    var monthAbbreviation;
    salesData.forEach((item) => {
      monthAbbreviation = new Date(0, item._id - 1).toLocaleString(
        "default",
        { month: "short" }
      );
      formattedSalesData[monthAbbreviation] = item.count;
    });
   
    let monthlySales = {}
    months.map((month) => {
      if(formattedSalesData[month]){
        monthlySales[month] = formattedSalesData[month]
      } else {
        monthlySales[month] = 0
      }
    });

    const userCount = await user_model.countDocuments({});
    const ordersCount = await order_model.countDocuments({});

    res.render("admin_index", {
      totalRevenue,
      userCount,
      ordersCount,
      ordertable,
      data,
      salesData: formattedSalesData,
      monthAbbreviation,
      monthlySales
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};


exports.bannerPage=async(req,res)=>{

  const banner=await banner_model.find()

  
  res.render('adminbanner',{banner})
}
exports.getaddbannerPage=async(req,res)=>{
  res.render('add_banner')
}
exports.addbanner=async(req,res)=>{
  const croppedImages = [];
  for (const file of req.files) {
    const croppedImage = `cropped_${file.filename}`;

    await sharp(file.path)
      .resize(500, 600, { fit: "cover" })
      .toFile(`uploads/${croppedImage}`);

    croppedImages.push(croppedImage);
  }

  const banner=new banner_model({

    image: croppedImages,


  })

  await banner.save()

  res.redirect('/banner')

}


exports.editbanner=async(req,res)=>{
  const {id}=req.params
  const banner=await banner_model.findById(id)


  res.render('edit_banner',{banner})
}




exports.updatebanner = async (req, res) => {
  try {
    const { id } = req.params;
    let newImages = [];

    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => file.filename);

      if (req.body.image) {
        try {
          fs.unlinkSync("./uploads/" + req.body.image); // Delete the old image file
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      newImages = req.body.image;
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid banner ID');
    }

    await banner_model.findByIdAndUpdate(id, { image: newImages });

    const banner = await banner_model.find();
    return res.render("adminbanner", { banner });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};




