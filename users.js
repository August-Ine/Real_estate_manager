const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

//constants
const dbName = "realestatedb";

//db schema
//users
const userSchema = new mongoose.Schema({
    isAdmin: Boolean
})
//handle authentication
userSchema.plugin(passportLocalMongoose);

//listings
const listingSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true
    },
    photoUrl: String,
    phoneNumber: String,
    constituency: String,
    propertyName: String,
    propertyDescription: String,
    longitude: Number,
    latitude: Number
});

//db models
const User = mongoose.model("User", userSchema);
const Listing = mongoose.model("Listing", listingSchema);

//connect db
const URI = "mongodb://127.0.0.1:27017/"; // local mongoDB uri

async function connectDb() {
    //connect to db, create db if doesnt exist
    try {
        await mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true, dbName: dbName });
        console.log("Connection to mongodb local host successful.");
    } catch (err) {
        console.log(err);
    }
}

function closeConnection() {
    mongoose.connection.close();
}

//module exports
module.exports = {
    User: User,
    Listing: Listing,
    connectDb: connectDb,
    closeConnection: closeConnection
}