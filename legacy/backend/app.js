const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
require('dotenv').config();
const { readdirSync } = require('fs')
const connectDB = require('./util/db')

const app = express();

// MiddleWare
app.use(morgan('dev'))
app.use(bodyParser.json({limit: '20mb'})) // application/json
app.use(cors()) 

// Route with ReadDIR
readdirSync('./routes').map((read) => app.use('/api', require('./routes/' +read),
))

// ConnectDB
connectDB()

const port = process.env.PORT
app.listen(port, () => {
    console.log('Server is running on port ' +port)
});
