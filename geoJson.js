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
        required: true
    },
    features: {
        type: [{
            type: mongoose.Schema.Types.Mixed,
            geometry: {
                type: {
                    type: String,
                    enum: ['Point', 'LineString', 'Polygon']
                },
                coordinates: {
                    type: [[[Number]]],
                    required: true
                }
            },
            properties: {
                type: mongoose.Schema.Types.Mixed
            }
        }],
        required: true
    }
});

const GeoJSONModel = mongoose.model('GeoJSON', geoJSONSchema);

module.exports = {
    GeoJSONModel: GeoJSONModel, connectDb: connectDb
};
