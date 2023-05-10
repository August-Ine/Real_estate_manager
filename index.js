const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const users = require("./users");
const seedCoordinates = require("./seed_coordinates");

//create app
const app = express();

//use body-parser as middleware to handle http request
app.use(bodyParser.urlencoded({ extended: true }));

//set up view engine
app.set('view engine', 'ejs');

//serve public static files
app.use(express.static("public"));

//connect to db
users.connectDb();

//seed random coordinates and property names to db
seedCoordinates.seedCoordinates();