const dns = require('dns')
dns.setServers(['1.1.1.1', '8.8.8.8'])
const mongoose = require('mongoose')
require("dotenv").config()
const connectDB = async ()=>{
try {
    await mongoose.connect(process.env.MONGO)
    console.log('DataBase Connected')
} catch (error) {
    console.log(error)
}
}
module.exports = connectDB