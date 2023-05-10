const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const users = require("./users");
const seedCoordinates = require("./seed_coordinates");
const mongoose = require("mongoose");

//create app
const app = express();

//use body-parser as middleware to handle http request
app.use(bodyParser.urlencoded({ extended: true }));

//set up view engine
app.set('view engine', 'ejs');

//serve public static files
app.use(express.static("public"));

//seed random coordinates and property names to db
// seedCoordinates.seedCoordinates();

//routes
//root
app.get("/", async (req, res) => {
    console.log("endpoint reached");
    //connect to db 
    users.connectDb();

    // Retrieve coordinates from the database
    try {
        const coordinates = await users.User.find({});

        // Render the EJS template and pass the coordinates
        res.render('home', { coordinates: coordinates });
        // Close the MongoDB connection
        mongoose.connection.close();
    } catch (e) {
        console.log(e);
        res.send(e);
    }
});

//serve web page
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});