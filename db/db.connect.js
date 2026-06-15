const mongoose = require('mongoose')
require('dotenv').config()

const mongoUri = process.env.MONGODB

const initializeDatabase = () => {
    mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false
    })
    .then(() => {
        console.log('Connected to Database')
    })
    .catch((error) => {
        console.log('Error connecting to database', error)
    })
}

module.exports = {initializeDatabase}