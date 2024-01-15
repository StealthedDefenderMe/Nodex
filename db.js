const mongoose = require("mongoose")
const mongoURI = "mongodb+srv://usertest377:M2l2r4H9xrMIOvkI@nodex9sf.zfmlfvo.mongodb.net/Nodex?retryWrites=true&w=majority"


const connectDB = async() =>{
    try {
        await mongoose.connect(mongoURI)
        console.log("MongoDB has been connected successfully.")
    } catch (error) {
        console.log('Error connecting MongoDB. ', error.message);
    }
}

module.exports = connectDB;