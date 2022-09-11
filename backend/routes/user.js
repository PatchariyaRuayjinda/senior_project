const express = require('express')
const router = express.Router()

//controller
const {listUsers,
    readUsers,
    updateUsers,
    deleteUser,
    changeStatus,
    changeRole,
    findUserByName,
    changePosition,
    updateProfileUser
} = require('../controllers/user')

// middleware
const {auth, authAdmin} = require('../middleware/auth')

//@Endpoint http://localhost:3001/api/listUsers
//@method GET
//@Access Private
router.get('/listUsers',auth, authAdmin, listUsers)

//@Endpoint http://localhost:3001/api/readUsers/:id
//@method GET
//@Access Private
router.get('/readUsers/:id', readUsers)

//@Endpoint http://localhost:3001/api/findUserByName/:username
//@method GET
//@Access Private
router.get('/findUserByname/:username', auth, findUserByName)

//@Endpoint http://localhost:3001/api/updateUsers
//@method PUT
//@Access Private
router.put('/updateUsers/:id',auth, authAdmin, updateUsers)

//@Endpoint http://localhost:3001/api/updateProfileUser
//@method PATCH
//@Access Private
router.patch('/updateProfileUser',auth, authAdmin, updateProfileUser)


//@Endpoint http://localhost:3001/api/deleteUser/:id
//@method DELETE
//@Access Private
router.delete('/deleteUser/:id', deleteUser)

//@Endpoint http://localhost:3001/api/change-status
//@method POST
//@Access Private
router.post('/change-status',auth, authAdmin, changeStatus)

//@Endpoint http://localhost:3001/api/change-role
//@method POST
//@Access Private
router.post('/change-role',auth, authAdmin, changeRole)

//@Endpoint http://localhost:3001/api/change-position
//@method POST
//@Access Private
router.post('/change-position',auth, authAdmin, changePosition)

module.exports = router