// server.js = start application
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing from .env");
}

// Connect to MongoDB with retry support and graceful failure handling
const connectDB = async (retries = 5, delay = 3000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log("Connected to MongoDB");
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
            return;
        } catch (error) {
            console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, error.message);
            if (attempt < retries) {
                console.log(`Retrying in ${delay / 1000}s...`);
                await new Promise((res) => setTimeout(res, delay));
            } else {
                console.error("MongoDB connection error: Could not connect to Atlas cluster.");
                console.error("Please verify that your current public IP is whitelisted in MongoDB Atlas Network Access: https://www.mongodb.com/docs/atlas/security-whitelist/");
                process.exit(1);
            }
        }
    }
};

connectDB();
