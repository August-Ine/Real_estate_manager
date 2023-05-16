const path = require("path");
const fs = require('fs');
const express = require("express");
const session = require('express-session');
const passport = require('passport');
const ejs = require("ejs");
const bodyParser = require("body-parser");
const users = require("./users");
const seedlistings = require("./seed_listings");
const LocalStrategy = require('passport-local').Strategy;
require('dotenv').config();
const flash = require('connect-flash');
const multer = require('multer');
const saveimage = require('./saveimage');

//create app
const app = express();
//connect to db
users.connectDb();

// Initialize Passport
app.use(passport.initialize());

// Configure express-session middleware
app.use(session({
    secret: 'keyboard warriors',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.set('trust proxy', 1); // trust first proxy

app.use(flash());//flash messages

app.use(passport.session());

// Configure Passport to use LocalStrategy for authentication
passport.use(new LocalStrategy(users.User.authenticate()));

// Serialize and deserialize user
passport.serializeUser(users.User.serializeUser());
passport.deserializeUser(users.User.deserializeUser());

//use body-parser as middleware to handle http request
app.use(bodyParser.urlencoded({ extended: true }));

//set up view engine
app.set('view engine', 'ejs');

//serve public static files
app.use(express.static("public"));

//secret key
const mapsKey = process.env.MAPS_API_KEY;

// Middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/'); // Redirect to the login page if not authenticated
}

//seed random listings and property names to db if db is empty
async function seedData() {
    try {
        const listings = await users.Listing.find({});
        if (listings.length === 0) await seedlistings.seedListings();
    } catch (e) {
        console.log(e);
    }
}
seedData();

async function getListings() {
    // Retrieve listings from the database
    try {
        const listings = await users.Listing.find({});
        return listings;
    } catch (e) {
        return e;
    }
}

//file upload
const upload = multer({ storage: saveimage.storage });

//routes
//root -login
app.get('/', async (req, res) => {
    res.render('login', { message: req.flash('error') }); // Render the login.ejs template
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/home', // Redirect to the dashboard upon successful login
    failureRedirect: '/', // Redirect back to the login page if authentication fails
    failureFlash: true // Enable flash messages for authentication failures
}), (req, res) => {
    // Successful authentication
    req.login(req.user, (err) => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        return res.redirect('/home');
    });
    req.flash('error', 'Invalid username or password'); // Set the error flash message
    res.redirect('/');
});

//register
app.get('/register', (req, res) => {
    res.render('register', { message: req.flash('error') }); // Render the register.ejs template
});

app.post('/register', async (req, res) => {
    // Create a new User instance with username
    const newUser = new users.User({ username: req.body.username });

    if (req.body.username === "admin") {
        newUser.isAdmin = true;
    } else {
        newUser.isAdmin = false;
    }
    //validation
    if (req.body.password !== req.body.confirmPassword) {
        // Passwords don't match, handle the error
        return res.render('register', { message: 'Passwords do not match' });
    }
    // Use Passport-Local Mongoose method to register the user
    users.User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            if (err.name === 'UserExistsError') {
                // Username is already taken
                return res.render('register', { message: 'Username is already taken' });
            }
            // Handle other registration errors
            console.error(err);
            req.flash('error', 'Error occurred during registration'); // Set the error flash message
            res.redirect('/register');
        }

        // If registration is successful, authenticate the user and redirect to a protected route
        passport.authenticate('local')(req, res, () => {
            res.redirect('/home'); // Redirect to the dashboard or any other desired route
        });
    });
});

//users home
app.get("/home", isLoggedIn, async (req, res) => {
    // Retrieve listings from the database
    try {
        const listings = await getListings();

        if (listings) {
            // Render the EJS template and pass the listings
            res.render('home', { listings: listings, mapsKey: mapsKey, req: req });

        } else {
            res.sendStatus(404);
        }

    } catch (e) {
        console.log(e);
        res.send(e);
    }
});

//location detail page
app.get('/detail/:locationId', isLoggedIn, async (req, res) => {
    // Access the parameter value using req.params
    const locationId = req.params.locationId;

    //used listingsCache to retrieve location info
    // if (listingsCache.length !== 0) {
    //     const selectedLocation = listingsCache.find(coordinate => coordinate._id == locationId);
    //     res.render('detail', { selectedLocation: selectedLocation, mapsKey: mapsKey }); // Pass the location data to the template
    // }

    //no cache, fetch from db
    await users.Listing.findById(locationId)
        .then((foundLocation) => {
            if (!foundLocation) {
                return res.status(404).json({ error: 'Location not found' });
            }
            res.render('detail', { selectedLocation: foundLocation, mapsKey: mapsKey }); // Pass the location data to the template
            // listingsCache.push(foundLocation); //cache results
        })
        .catch((error) => {
            res.status(500).json({ error: 'Server error' });
        });
});

app.get("/logout", isLoggedIn, function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect("/");
    });
});

//admin
app.get('/create-listing', isLoggedIn, (req, res) => {
    res.render('create-listing', { mapsKey: mapsKey });
});

app.post('/create-listing', isLoggedIn, upload.single('image'), async (req, res) => {
    //image url
    // Check if an image file was uploaded
    if (!req.file) {
        return res.status(400).json({ error: 'Please select an image file' });
    }
    // Access the uploaded image using req.file
    const uploadedFile = req.file;

    // Get the file extension
    const fileExtension = path.extname(uploadedFile.originalname);
    const photoUrl = 'image' + '_' + req.body.userName + fileExtension;

    // Process the form data
    const { userName, phoneNumber, constituency, propertyName, propertyDescription, longitude, latitude } = req.body;

    // Convert latitude and longitude values to numbers
    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);

    try {
        // Create a new Listing instance with the form inputs
        const newListing = new users.Listing({
            userName,
            photoUrl,
            phoneNumber,
            constituency,
            propertyName,
            propertyDescription,
            longitude: numericLongitude,
            latitude: numericLatitude
        });

        // Save the new listing to the database
        const savedListing = await newListing.save();
        //add to cache
        // listingsCache.push(newListing);

        res.render("success", { listing: savedListing });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create listing' });
    }
});

app.get("/update-listing/:listing_id", isLoggedIn, async (req, res) => {
    listingId = req.params.listing_id;
    await users.Listing.findById(listingId)
        .then((foundLocation) => {
            if (!foundLocation) {
                return res.status(404).json({ error: 'Location not found' });
            }
            res.render('update-listing', { listing: foundLocation, mapsKey: mapsKey }); // Pass the location data to the template
            // listingsCache.push(foundLocation); //cache results
        })
        .catch((error) => {
            res.status(500).json({ error: 'Server error' });
        });
})

// POST route for updating a listing
app.post('/update-listing/:listing_id', isLoggedIn, upload.single('image'), async (req, res) => {
    const listing_id = req.params.listing_id;
    const updatedListing = {
        userName: req.body.userName,
        phoneNumber: req.body.phoneNumber,
        constituency: req.body.constituency,
        propertyName: req.body.propertyName,
        propertyDescription: req.body.propertyDescription,
        longitude: req.body.longitude,
        latitude: req.body.latitude
    };

    try {
        const listing = await users.Listing.findById(listing_id);
        if (!listing) {
            return res.status(404).send('Listing not found');
        }
        // Check if an image file was uploaded
        if (!req.file) {
            updatedListing.photoUrl = listing.photoUrl;//keep old photoUrl
            // Update the listing with the updated values
            listing.set(updatedListing);
            await listing.save();
            res.redirect('/home'); // Redirect to a page displaying all listings
        } else {
            // Access the uploaded image using req.file
            const uploadedFile = req.file;

            // Get the file extension
            const fileExtension = path.extname(uploadedFile.originalname);
            const photoUrl = 'image' + '_' + req.body.userName + fileExtension;
            updatedListing.photoUrl = photoUrl;
            listing.set(updatedListing);
            await listing.save();
            res.redirect('/home'); // Redirect to a page displaying all listings
        }


    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

//delete a listing
app.post("/delete-listing", isLoggedIn, async (req, res) => {
    const listing_id = req.body.listingId;
    const listing = await users.Listing.findById(listing_id);

    if (listing) {
        try {
            //delete listing image from images
            const imagePath = path.join(__dirname, 'public/images/' + listing.photoUrl);

            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }

                console.log('Image file deleted successfully');
            });

            // Delete the entity
            await listing.deleteOne(); // or entity.deleteOne()
            res.redirect('/home'); // Redirect to a relevant page after deletion
        } catch (err) {
            console.error(err);
            res.status(500).send('Error deleting entity');
        }
    } else {
        console.log('Entity not found');
    }
});

//serve web page
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});