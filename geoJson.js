const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

//constants
const dbName = "geojsondb";

const URI = "mongodb://127.0.0.1:27017/"; // local mongoDB uri

async function connectDb() {
    //connect to db, create db if doesnt exist
    try {
        await mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true, dbName: dbName });
        console.log("Connection to geojson local host successful.");
    } catch (err) {
        console.log(err);
    }
}

const geoJSONSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['FeatureCollection'],
        required: true,
    },
    coordinates: {
        type: [Number],
        required: true,
    }
});

const MySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    geoJSON: {
        type: geoJSONSchema,
        required: true,
    },
});

const MyModel = mongoose.model('MyModel', MySchema);

module.exports = {
    GeoJSONModel: MyModel, connectDb: connectDb
};
