const mongoose = require('mongoose')

const departmentSchema = new mongoose.Schema(
    {
        departmentName:{type: String}
    }
)
module.exports = department = mongoose.model('department', departmentSchema)