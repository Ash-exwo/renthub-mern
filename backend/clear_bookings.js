require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("./src/models/BookingModel");
const Payment = require("./src/models/PaymentModel");
const Review = require("./src/models/ReviewModel");
const Notification = require("./src/models/NotificationModel");
const Listing = require("./src/models/ListingModel");

async function clearBookingsAndData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.\n");

    const bookingCount = await Booking.countDocuments();
    const paymentCount = await Payment.countDocuments();
    const reviewCount = await Review.countDocuments();
    const notifCount = await Notification.countDocuments();

    console.log(`Found in Database:`);
    console.log(`- Bookings:      ${bookingCount}`);
    console.log(`- Payments:      ${paymentCount}`);
    console.log(`- Reviews:       ${reviewCount}`);
    console.log(`- Notifications: ${notifCount}\n`);

    // 1. Delete all bookings
    const delBookings = await Booking.deleteMany({});
    console.log(`✓ Deleted ${delBookings.deletedCount} bookings.`);

    // 2. Delete all payment escrow records
    const delPayments = await Payment.deleteMany({});
    console.log(`✓ Deleted ${delPayments.deletedCount} payments.`);

    // 3. Delete all reviews
    const delReviews = await Review.deleteMany({});
    console.log(`✓ Deleted ${delReviews.deletedCount} reviews.`);

    // 4. Delete notifications
    const delNotifs = await Notification.deleteMany({});
    console.log(`✓ Deleted ${delNotifs.deletedCount} notifications.`);

    // 5. Reset listing rating aggregates to 0
    const updateListings = await Listing.updateMany({}, { averageRating: 0, totalReviews: 0 });
    console.log(`✓ Reset ratings on ${updateListings.modifiedCount} listings to 0 (0 reviews).`);

    console.log("\n=======================================================");
    console.log("       🎉 Database Cleaned! Ready for Fresh Testing!   ");
    console.log("=======================================================\n");
  } catch (error) {
    console.error("Error clearing database:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearBookingsAndData();
