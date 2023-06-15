const mongoose = require('mongoose');


const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'new_users',
        required: true
    },
    orderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',

    },
    balance: {
        type: Number,
        required: true
    },
    transactions: [{
        type: String,
        required: true
      }]
})

module.exports = mongoose.model('wallet', walletSchema);