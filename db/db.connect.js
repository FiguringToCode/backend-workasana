const mongoose = require('mongoose')
require('dotenv').config()

const mongoUri = process.env.MONGODB

const initializeDatabase = async () => {
    await mongoose.connect(mongoUri)
    .then(() => {
        if(mongoose.connection.readyState !== 1){
            console.log("Database not ready")
            return "Database not ready"
        } else {
            console.log("Connected to database")
            return "Connected to Database"
        }
    })
    .catch((error) => {
        console.log('Error connecting to database', error)
    })
}

module.exports = {initializeDatabase}