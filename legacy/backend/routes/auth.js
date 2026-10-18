const express = require('express')
const router = express.Router()

//controller
const {
    register, 
    login, 
    currentUser
} = require('../controllers/auth')

// middleware
const {auth, authManager, authAdmin} = require('../middleware/auth')

//@Endpoint http://localhost:3001/api/register
//@method POST
//@Access Publish
router.post('/register', register)

//@Endpoint http://localhost:3001/api/login
//@method POST
//@Access Publish
router.post('/login', login)

//@Endpoint http://localhost:3001/api/current-user
//@method POST
//@Access Private
router.post('/current-user', auth, currentUser)

//@Endpoint http://localhost:3001/api/current-manager
//@method POST
//@Access Private
router.post('/current-manager', auth, authManager, currentUser)

//@Endpoint http://localhost:3001/api/current-admin
//@method POST
//@Access Private
router.post('/current-admin', auth, authAdmin, currentUser)


module.exports = router