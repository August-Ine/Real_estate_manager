const mongoose = require("mongoose");
const faker = require('faker');
const Users = require('./users');

async function seedCoordinates() {
    const numCoordinates = 10; // Specify the number of coordinates you want to generate

    for (let i = 0; i < numCoordinates; i++) {
        const username = faker.internet.userName();
        const latitude = faker.address.latitude({
            min: -1.2845,
            max: -1.2644
        });
        const longitude = faker.address.longitude({
            min: 36.8471,
            max: 36.8779
        });
        const propertyName = faker.address.streetName();
        const propertyDescription = faker.lorem.sentence();

        // Create and save the coordinate in the database
        const coordinate = new Users.User({ username, latitude, longitude, propertyName, propertyDescription });
        await coordinate.save();
    }

    console.log('Seed data created successfully');

    // Close the MongoDB connection
    mongoose.connection.close();
}

// export seedCoordinates function
module.exports = { seedCoordinates: seedCoordinates };
