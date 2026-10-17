const mongoose = require('mongoose')

const positionSchema = new mongoose.Schema(
    {
        positionName:{type: String}
    }
)
module.exports = position = mongoose.model('position', positionSchema)