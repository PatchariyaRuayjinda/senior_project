const mongoose = require('mongoose')

const ZoneSchema = new mongoose.Schema(
    {
        zonetype:{type: String}  
    }
)
module.exports = zone = mongoose.model('zones', ZoneSchema)