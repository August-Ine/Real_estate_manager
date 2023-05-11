const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const users = require("./users");
const seedCoordinates = require("./seed_coordinates");
const mongoose = require("mongoose");
require('dotenv').config();

//create app
const app = express();

//use body-parser as middleware to handle http request
app.use(bodyParser.urlencoded({ extended: true }));

//set up view engine
app.set('view engine', 'ejs');

//serve public static files
app.use(express.static("public"));

//secret key
const mapsKey = process.env.MAPS_API_KEY;

//seed random coordinates and property names to db if db is empty
async function seedData() {
    try {
        users.connectDb();
        const coordinates = await users.User.find({});
        if (coordinates.length === 0) seedCoordinates.seedCoordinates();
    } catch (e) {
        console.log(e);
    }
}
seedData();

//cached coordinates
var coordinatesCache = [];

async function getLocations() {
    //attempt to retrieve from cache
    if (coordinatesCache.length !== 0) { return coordinatesCache }

    // Retrieve coordinates from the database
    try {
        const coordinates = await users.User.find({});
        return coordinates;
    } catch (e) {
        return e;
    }
}


//routes
//root
app.get("/", async (req, res) => {
    //connect to db 
    users.connectDb();

    // Retrieve coordinates from the database
    try {
        const coordinates = await getLocations();

        if (coordinates) {
            if (coordinatesCache.length === 0) {
                //cache results
                coordinatesCache = [...coordinates];
            }
            // Render the EJS template and pass the coordinates
            res.render('home', { coordinates: coordinates, mapsKey: mapsKey });

        } else {
            res.sendStatus(404);
        }

    } catch (e) {
        console.log(e);
        res.send(e);
    }

    // Close the MongoDB connection
    users.closeConnection();
});

//location detail page
app.get('/detail/:locationId', async (req, res) => {
    // Access the parameter value using req.params
    const locationId = req.params.locationId;

    //used coordinatesCache to retrieve location info
    if (coordinatesCache.length !== 0) {
        const selectedLocation = coordinatesCache.find(coordinate => coordinate._id == locationId);
        res.render('detail', { selectedLocation: selectedLocation, mapsKey: mapsKey }); // Pass the location data to the template
    }

    //no cache, fetch from db
    else {
        //connect to db 
        users.connectDb();
        await users.User.findById(locationId)
            .then((foundLocation) => {
                if (!foundLocation) {
                    return res.status(404).json({ error: 'Location not found' });
                }
                res.render('detail', { selectedLocation: foundLocation }); // Pass the location data to the template
                coordinatesCache.push(foundLocation); //cache results
                // Close the MongoDB connection
                users.closeConnection();
            })
            .catch((error) => {
                res.status(500).json({ error: 'Server error' });
            });
    }
});

//serve web page
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});