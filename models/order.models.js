const mongoose = require('mongoose');

let orderSchema=mongoose.Schema({
    userId:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:'User',
        required:true
    },
    products: [
        {
        productId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'products',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        priceAtPurchase: {
            type: Number,
            required: true,
            min: 0
        }
        }
    ],
    totalPrice:{
        type:Number,
        required:true,
        min:0
    },
    status:{
        type:String,
        enum:['pending','shipped','delivered','cancelled'],
        default:'pending'
    },
    shippingAddress:{
        type:String,
        required:true
    },
    paymentMethod:{
        type:String,
        enum:['credit_card','paypal','cash_on_delivery'],
        default:'credit_card'
    },
    paymentStatus:{
        type:String,
        enum:['pending','paid','failed','unpaid'],
        default:'unpaid'
    },
}, 
{ timestamps: true})



orderSchema.pre('save', function(next) {
    let total = 0;
    this.products.forEach(p => {
      total += p.priceAtPurchase * p.quantity;
    });
    this.totalPrice = total;
    next();
});  

let orderModel=mongoose.model('Order',orderSchema)
module.exports=orderModel