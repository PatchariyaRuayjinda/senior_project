const bcrypt = require('bcryptjs')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

exports.listUsers = async(req, res, next) => {
    try{
        const user = await User.find({})
        .select('-password')
        .exec();
        res.send(user)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.readUsers = async(req, res, next) => {
    try{
        const {id} = req.params
        console.log(id)
        const user = await User.findOne({_id: id})
        .select('-password')
        .exec()
        res.send(user)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.findUserByName = async(req, res) => {
    try{
        const {username} = req.params
        console.log(username)
        const user = await User.findOne({username: username})
        .select('-password')
        .exec()
        res.send(user)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.updateUsers = async(req, res, next) => {
    try{
        console.log(req.body.value)
        const {id, password} = req.body.value
        // gen salt
        const salt = await bcrypt.genSalt(10)
        // encrypt
        var newPassword = await bcrypt.hash(password, salt);
        // console.log(newPassword)

        await User.findOneAndUpdate(
            {_id: id},
            {password: newPassword}
        )
        res.send('Success!!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.updateProfileUser = async(req, res, next) => {
    try{
        console.log(req.body)
        const {
            id,
            username,
            firstname,
            surname,
            email,
            department
        } = req.body
        var newUser = {
            username,
            firstname,
            surname,
            email,
            department
        }
        await User.updateOne(
            {_id: id},
            {$set: newUser}
        )
        res.send('Update Profile User Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.deleteUser = async(req, res, next) => {
    try{
        const { id } = req.params
        const user = await User.findOneAndDelete({_id: id})
        .exec()
        res.send('Delete Success!')
        // .then(res.status(200).json({
        //     response:{
        //         "result": true,
        //         "message": "success"
        //     }
        // })).catch(err => {
        //     res.status(200).json({
        //         response: {
        //             "result": false,
        //             "message": err
        //         }
        //     })
        // })
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.changeStatus = async(req, res, next)=>{
    try{
        const {id, enabled} = req.body
        const user = await User.findOneAndUpdate({_id: id}, {enabled: enabled});
        res.send('Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.changeRole = async(req, res, next)=>{
    try{
        const {id, role} = req.body
        const user = await User.findOneAndUpdate({_id: id}, {role: role});
        res.send('Success!')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.changePosition = async(req, res, next) => {
    try{
        const {id, position} = req.body
        const user = await User.findOneAndUpdate({_id: id}, {position: position});
        res.send('Success')
    }catch(err) {
        console.log(err)
        res.status(500).send('Server Error!')
    }
}