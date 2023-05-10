const mongoose = require("mongoose");

//constants
const dbName = "realestatedb";

//db schema 
const userSchema = new mongoose.Schema({
    userName: String,
    propertyName: String,
    propertyDescription: String,
    longitude: String,
    latitude: String
});

//db model
const User = mongoose.model("user", userSchema);

//connect db
const URI = "mongodb://127.0.0.1:27017/"; // local mongoDB uri

async function connectDb() {
    //connect to db, create db if doesnt exist
    try {
        await mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true, dbName: dbName });
        console.log("Connection to mongodb local host successful.");
        //close connection after test
        //mongoose.connection.close();
    } catch (err) {
        console.log(err);
    }
}

//module exports
module.exports = {
    User: User,
    connectDb: connectDb
}