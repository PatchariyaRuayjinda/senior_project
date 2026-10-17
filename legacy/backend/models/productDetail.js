const mongoose = require('mongoose')

const ProductDetailSchema = new mongoose.Schema(
    {
        receiveDate:{type: Date, default: Date.now},
        expireDate:{type: Date},
        receiveQuantity:{type: Number},
        product_id:{type: mongoose.ObjectId}
    }
)
module.exports = productDetail = mongoose.model('productDetail', ProductDetailSchema)
