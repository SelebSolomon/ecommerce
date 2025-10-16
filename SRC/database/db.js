const mongoose = require('mongoose')



const database = async () => {
    try {
        const url = process.env.MONGOURL
        const conn = await mongoose.connect(url)
        console.log('mongodb is connected', conn.connection.name)
    } catch (error) {
       console.log(error.message) 
    }
}

module.exports = database;