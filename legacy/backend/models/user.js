const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
    {
        username:{type: String},
        password:{type: String},
        firstname:{type: String},
        surname:{type: String},
        email:{type: String},
        position:{type: String},
        department:{type: String},
        // role:{type: String, default: 'user'}
    },
    {timestamps: true} 
)
module.exports = user = mongoose.model('users', UserSchema)