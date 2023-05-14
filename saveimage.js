const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images'); // Specify the destination directory
    },
    filename: function (req, file, cb) {
        // Generate a unique filename for the uploaded image
        const uniqueFileName = 'image' + '_' + req.body.userName + path.extname(file.originalname);
        cb(null, uniqueFileName);
    }
});

module.exports = { storage: storage }
