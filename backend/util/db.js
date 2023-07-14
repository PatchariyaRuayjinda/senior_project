const mongoose = require('mongoose')

const connectDB = async() => {
    const dbHost = process.env.DB_HOST
    const dbName = process.env.DB_NAME

    if(dbHost || dbName) return
    const database = dbHost+dbName

    console.log('database', database)
    try{
        await mongoose.connect(database)
        console.log('Connect Success!')
    }catch(err){
        console.log('err', err)
        process.exit(1)
    }
}

module.exports = connectDB