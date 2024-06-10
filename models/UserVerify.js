const mongoose = require('mongoose');

// Define a schema for the User collection
const userVerifySchema = new mongoose.Schema({
    userID: String,
	uniqueString: String,
	createdAt: Date,
	expiresAt: Date
});



// Create a User model based on the schema
const UserVerify = mongoose.model("UserVerify", userVerifySchema);

module.exports = UserVerify;