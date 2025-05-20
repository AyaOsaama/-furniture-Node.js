const mongoose = require('mongoose');

let cartSchema = mongoose.Schema({
    productId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'products',
        required: true
    },
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },    
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    priceAtAddition:{
        type: Number,
        required: true,
        min: 0
    }
})


let cartModel = mongoose.model('Cart', cartSchema)
module.exports = cartModel