const jwt = require('jsonwebtoken');
const user = require('../models/user');

exports.auth = (req, res, next) => {
    try{
        const token = req.headers["authtoken"];
        if(!token) {
            return res.status(401).send('no token, authorization denied')
        }
        const decoded = jwt.verify(token, "jwtSecret");
        // console.log('middleware', decoded)
        req.user = decoded.user
        next()
    }catch(err){
        console.log(err)
        res.status(401).send('Token Invalid!')
    }
}

exports.authAdmin = async (req, res, next) => {
    try{
        const {username} = req.user
        const adminUser = await user.findOne({username}).exec()
        // if (adminUser.role !== 'admin'){
        // if (adminUser.position !== 'Warehouse Supervisor'){
        if(adminUser.position !== 'Manager'){
            res.status(403).send(err,'Access denied')
        } else {
            next()
        }
    }catch(err){
        console.log(err)
        res.status(401).send('Access denied')
    }
}