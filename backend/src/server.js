// server.js = start application
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI ;

if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing from .env");
  }

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });
