const bcrypt = require('bcryptjs')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

exports.findAllUser = async(req, res, next) => {
    try{
        res.send('find all user')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.register = async(req, res, next) => {
    try{
        // Check user
        const { username, 
            password, 
            firstname, 
            surname, 
            email, 
            position, 
            department 
        } = req.body
        var user = await User.findOne({username})
        if(user){
            return res.status(400).send('User Already exists')
        }
        // gen salt
        const salt = await bcrypt.genSalt(10)
        user = new User({
            username,
            password,
            firstname, 
            surname, 
            email, 
            position, 
            department 
        });

        // Encrypt
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        res.send('Register Success')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        console.log(username, password)
        var user = await User.findOneAndUpdate({username}, {new: true });
        // if(user && user.enabled){
        if(user){
            // Check Password
            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch){
                return res.status(400).send('Password Invalid')
            }
            // Payload
            const payload = {
                user:{
                    username: user.username,
                    firstname: user.firstname,
                    // role: user.role 
                    position: user.position
                }
            }
            // Generate Token
            jwt.sign(payload, 'jwtSecret', {expiresIn: '24h'}, (err, token) => {
                if(err) throw err;
                res.json({token, payload})
            })

        }else {
            return res.status(400).send('User Not found!')
        }
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.currentUser = async(req, res, next) => {
    try{
        // model User
        console.log('currentUser',req.user)
        const user = await User.findOne({username: req.user.username})
        .select('-password')
        .exec();
        res.send(user)
        console.log('user',user)
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.editUser = async(req, res, next) => {
    try{
        res.send('find all user')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}

exports.deleteUser = async(req, res, next) => {
    try{
        res.send('find all user')
    }catch(err){
        console.log(err)
        res.status(500).send('Server Error!')
    }
}