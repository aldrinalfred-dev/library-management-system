const express = require("express");
const bcrypt = require("bcryptjs");
//Email handler
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const path = require('path');

// MongoDB user model
const User = require("../models/User");
const UserVerify = require("../models/UserVerify");

const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


document.getElementById('signin-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let email = document.getElementById('signin_email').value;
    let password = document.getElementById('signin_pass').value;

    fetch('/user/api/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'FAILED') {
            alert(data.message);
        } else {
            console.log(data)
            alert('Sign in successful!');
            alert(data.message);
        }
    });
});


//Password reset API
let transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

// To verify if nodemailer is working or not
transporter.verify((error, success) => {
	if (error) {
		console.log(error);
	} else {
		console.log("Ready for messages");
		console.log(success);
	}
});

const sendVerificationEmail = ({ _id, email }, res) => {
	const currentURL = "https://localhost:3443/";
	const uniqueString = uuidv4() + _id;
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: "Verify your email",
		html: `<p>Verify your email address to complete the signup and login into your account</p><p>This link <b>expires in 6 hours</b>.</p><p>Press <a href=${
			currentURL + "user/verify/" + _id + "/" + uniqueString}>here</a> to proceed.</p>`,
	};

	//Hash the unique string
	const saltRounds = 10;
	bcrypt
		.hash(uniqueString, saltRounds)
		.then((hashedUniqueString) => {
			//set values in user verification collection
			const newVerification = new UserVerify({
				userID: _id,
				uniqueString: hashedUniqueString,
				createdAt: Date.now(),
				expiresAt: Date.now() + 21600000,
			});

			newVerification
				.save()
				.then(() => {
					transporter
						.sendMail(mailOptions)
						.then(() => {
							res.json({
								status: "PENDING",
								message: "Verification email sent",
							});
						})
						.catch((err) => {
							console.log(err),
								res.json({
									status: "FAILED",
									message: "Verification mail failed",
								});
						});
				})
				.catch((err) => {
					console.log(err);
					res.json({
						status: "FAILED",
						message: "Couldn't save verification email data",
					});
				});
		})
		.catch((err) => {
			res.json({
				status: "FAILED",
				message: "An error occured while hashing email data!",
			});
		});
};