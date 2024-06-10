const mongoose = require('mongoose');

// Define a schema for the User collection
const PasswordResetSchema = new mongoose.Schema({
    userID: String,
	resetString: String,
	createdAt: Date,
	expiresAt: Date
});

// Create a User model based on the schema
const PasswordReset = mongoose.model("PasswordReset", PasswordResetSchema);

module.exports = PasswordReset;