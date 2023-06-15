const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "new_users",
      required: true,
    },
    total:{
      type:Number
    },

    wallet:{
      type:Number

    },
    
    
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
       
      },
    ],
  },
  { timestamps: true }
);
const cart = new mongoose.model("cart", CartSchema);
module.exports = cart;