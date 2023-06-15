const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
  },
  product_price: {
    type: Number,
    required: true,
    // Add unique constraint on product_price field
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category_collections",
  },
  image: [
    {
      type: String,
      required: true,
    },
  ],
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  product_description: {
    type: String,
    required: true,
  },
  product_brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "brand_collection",
  },
  product_stock: {
    type: Number,
    required: true,
  },
  product_status: {
    default: true,
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model("products", productSchema);
