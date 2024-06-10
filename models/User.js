const mongoose = require('mongoose');

// Define a schema for the User collection
const userSchema = new mongoose.Schema({
    username: String,
	email: String,
	password: String,
	verified: Boolean
});

// Create a User model based on the schema
const User = mongoose.model("User", userSchema);

module.exports = User;