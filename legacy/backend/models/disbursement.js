const mongoose = require('mongoose')

const disbursementSchema = new mongoose.Schema(
    {
        user_id:{type: mongoose.ObjectId},
        product_id:{type: mongoose.ObjectId},
        quantity:{type: Number},
        date:{type: Date, default: Date.now},
        state:{type: Boolean}
    }
)
module.exports = disbursement = mongoose.model('disbursement', disbursementSchema)