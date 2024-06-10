const express = require("express");
const bcrypt = require("bcryptjs");
//Email handler
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const path = require('path');

dotenv.config();
const router = express.Router();

// MongoDB user model
const User = require("../models/User");
const UserVerify = require("../models/UserVerify");
const PasswordReset = require("../models/PasswordReset");

const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


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
		console.log("Mail trap SMTP server ready for messages");
	}
});

const sendVerificationEmail = ({ _id, email }, res) => {
	const currentURL = "https://localhost:3443/";
	const uniqueString = uuidv4() + _id;
	const mailOptions = {
		from: "groupfive_itis_library@gmail.com",
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

//Verify email
router.get("/verify/:userID/:uniqueString", (req, res) => {
	let { userID, uniqueString } = req.params;
	UserVerify.find({ userID })
		.then((result) => {
			if (result.length > 0) {
				const { expiresAt } = result[0];
				const hashedUniqueString = result[0].uniqueString;
				// Checking for expired unique string
				if (expiresAt < Date.now()) {
					UserVerify.deleteOne({ userID })
						.then((res) => {
							User.deleteOne({ _id, userID })
								.then(() => {
									res.json({
										status: FAILED,
										message: "Link has expired. Please sign up again",
									});
								})
								.catch((err) => {
									console.log(err),
										res.json({
											status: FAILED,
											message: "Clearing expired unique string failed",
										});
								});
						})
						.catch((err) => {
							console.log(err),
								res.json({
									status: FAILED,
									message:
										"An error occured when clearing expired user verification record",
								});
						});
				} else {
					//valid record exists
					// First compare the hashed unique string
					bcrypt
						.compare(uniqueString, hashedUniqueString)
						.then((result) => {
							if (result) {
								//strings match
								User.updateOne({ _id: userID }, { verified: true })
									.then(() => {
										UserVerify.deleteOne({ userID })
											.then(() => {
												res.sendFile(
													path.join(__dirname, "../public/verified.html")
												);
											})
											.catch((err) => {
												console.log(err),
													res.json({
														status: FAILED,
														message:
															"An error occured while finalizing successful verification",
													});
											});
									})
									.catch((err) => {
										console.log(err),
											res.json({
												status: FAILED,
												message:
													"An error occured while updating user record to show verification as true",
											});
									});
							} else {
								//existing record but incorrect verification details passed.
								res.json({
									status: FAILED,
									message:
										"An Invalid verification details passed. Check your inbox",
								});
							}
						})
						.catch((err) => {
							console.log(err),
								res.json({
									status: FAILED,
									message: "An error occured when comparing unique strings.",
								});
						});
				}
			} else {
				res.json({
					status: "FAILED",
					message:
						"Account record doesn't exist or has been verified already. Please sign up or log in",
				});
			}
		})
		.catch((err) => {
			console.log(err),
				res.json({
					status: "FAILED",
					message:
						"An error occured while checking for existing user verification record",
				});
		});
});

router.get("/verified", (req, res) => {
	res.sendFile(path.join(__dirname, "./../public/verified.html"));
});

//Sign up API
router.post("/api/signup", (req, res) => {
	let { username, email, password } = req.body;
	username = username.trim();
	email = email.trim();
	password = password.trim();

	if (username == "" || email == "" || password == "") {
		res.json({
			status: "FAILED",
			message: "Empty input fields",
		});
	} else if (!/^[a-zA-Z]*$/.test(username)) {
		res.json({
			status: "FAILED",
			message: "Invalid username entered",
		});
	} else if (!emailRegexPattern.test(email)) {
		res.json({
			status: "FAILED",
			message: "Invalid email entered",
		});
	} else if (password.length < 8) {
		res.json({
			status: "FAILED",
			message: "Password is too short!",
		});
	} else {
		// Check if  email already exists
		const existingUser = User.findOne({ email });
		existingUser
			.then((result) => {
				if (result) {
					res.json({
						status: "FAILED",
						message: "User with provided email already exists",
					});
				} else {
					// Hash the password
					const saltRounds = 10;
					const hashedPassword = bcrypt
						.hash(password, saltRounds)
						.then((hashedPassword) => {
							// Create new user
							const newUser = new User({
								username,
								email,
								password: hashedPassword,
								verified: false,
							});

							newUser
								.save()
								.then((result) => {
									//handle account verification
									sendVerificationEmail(result, res);
								})
								.catch((err) => {
									res.json({
										status: "FAILED",
										message: "Error occurred when saving user details.",
									});
								});
						})
						.catch((err) => {
							res.json({
								status: "FAILED",
								message: "Error occurred when hashing password",
							});
						});
				}
			})
			.catch((err) => {
				console.log(err);
				res.json({
					status: "FAILED",
					message: "An error has occured when checking for existing user",
				});
			});
	}
});

// Login API
router.post("/api/signin", (req, res) => {
	let { email, password } = req.body;
	email = email.trim();
	password = password.trim();

	if (email == "" || password == "") {
		res.json({
			status: "FAILED",
			message: "Empty credentials provided.",
		});
	} else {
		//Check if user exists
		User.find({ email })
			.then((data) => {
				if (data.length) {
					if (!data[0].verified) {
						res.json({
							status: "FAILED",
							message: "Email hasn't been verified yet. Check your inbox",
							data: data,
						});
					} else {
						const hashedPassword = data[0].password;
						bcrypt
							.compare(password, hashedPassword)
							.then((result) => {
								if (result) {
									//Password match
									res.json({
										status: "SUCCESS",
										message: "Sign in successful",
										data: data,
									});
								} else {
									res.json({
										status: "FAILED",
										message: "Invalid password entered",
										password: password,
										hashedPassword: hashedPassword,
										result: result,
									});
								}
							})
							.catch((err) => {
								console.log(err)
								res.json({
									status: "FAILED",
									message: "An error occured while comparing passwords.",
								});
							});
					}
				} else {
					res.json({
						status: "FAILED",
						message: "Invalid credentials entered!",
					});
				}
			})
			.catch((err) => {
				console.log(err)
				res.json({
					status: "FAILED",
					message: "An error occured while checking for existing user",
				});
			});
	}
});

// Password reset API
router.post("/requestPasswordReset", (req, res) => {
	const {email, redirectURL} = req.body;
	// Check if email exists
	User.find({email})
	.then(data => {
		if(data.length){
			// User exists
			// Check if user is verified
			if(!data[0].verified){
				res.json({
					status: "FAILED",
					message: "Email is not verified yet. Check inbox"
				})
			} else {
				sendResetEmail(data[0], redirectURL, res);
			}
		} else {
			res.json({
				status: "FAILED",
				message: "No account with the provided email exists"
			})
		}
	})
	.catch(err => {
		console.log(err);
		res.json({
			status: "FAILED",
			message: "An error occured while checking for existing user"
		})
	})
})

const sendResetEmail = ({_id, email}, redirectURL, res) => {
	const resetString = uuidv4() + _id;
	PasswordReset.deleteMany({userID: _id})
		.then(result => {
			// Reset records deleted successfully
			const mailOptions = {
				from: process.env.EMAIL_USER,
				to: email,
				subject: "Password reset",
				html: `<p>We received a request to reset your password. Click the link below to choose a new password:</p><p>This link <b>expires in 60 minutes</b>.</p><p>Press <a href=${
					redirectURL + "/" + _id + "/" + resetString}>here</a> to proceed.</p>`,
			};
			// Hash reset string
			const saltRounds = 10;
			bcrypt.hash(resetString, saltRounds)
			.then(hashedResetString => {
				// Set values in password reset collection
				const newPasswordReset = new PasswordReset({
					userID: _id,
					resetString: hashedResetString,
					createdAt: Date.now(),
					expiresAt: Date.now() + 3600000
				})
				newPasswordReset.save()
					.then(() => {
						transporter.sendMail(mailOptions)
							.then(() => {
								// reset email send and password reset record saved
								res.json({
									status: "PENDING",
									message: "Password reset email sent"
								})
							})
							.catch(err => {
								console.log(err);
								res.json({
									status: "FAILED",
									message: "Password reset email failed"
								})
							})
					})
					.catch(err => {
						console.log(err);
						res.json({
							status: "FAILED",
							message: "An error occured in saving password reset data"
						})
					})
			})
			.catch(err => {
				console.log(err);
				res.json({
					status: "FAILED",
					message: "An error occured while hashing the password reset data"
				})
			})
		})
		.catch(err => {
			// error while clearing existing records
			res.json({
				status: "FAILED",
				message: "Clearing existing password reset records failed."
			})
		})
}


router.post("/api/resetPassword", (req, res) => {
	let {userID, resetString, newPassword} = req.body
	PasswordReset
		.find({userID})
		.then(result => {
			if(result.length > 0){
				//Check if password reset record exists
				const {expiresAt} = result[0];
				const hashedResetString = result[0].resetString;
				// Checking for expired reset string
				if(expiresAt < Date.now()){
					PasswordReset.deleteOne({userID})
					.then(() => {
						// Reset record deleted successfully
						res.json({
							status: "FAILED",
							message: "Password reset link has expired"
						})
					}
					)
					.catch(err => {
						// deletion failed
						console.log(err);
						res.json({
							status: "FAILED",
							message: "Clearing password reset record failed"
						})
					})
				} else {
					// validate reset string
					bcrypt
						.compare(resetString, hashedResetString)
						.then((result) => {
							if (result) {
								// strings matched
								// hash password again
								const saltRounds=10;
								bcrypt.hash(newPassword, saltRounds)
								.then(hashedNewPassword => {
									// update user password
									User.updateOne({_id: userID}, {password: hashedNewPassword})
									.then(() => {
										// Next delete reset record
										PasswordReset.deleteOne({userID})
										.then(() => {
											res.json({
												status: "SUCCESS",
												message: "Password has been reset successfully."
											})
										})
										.catch(err => {
											console.log(err);
											res.json({
												status: "FAILED",
												message: "An error occured when trying to delete reset password record."
											})
										})
									})
									.catch(err => {
										console.log(err);
										res.json({
											status: "FAILED",
											message: "Updating user password failed."
										})
									})
								})
								.catch(err => {
									res.json({
										status: "FAILED",
										message: "An error occured while hashing new password"
									})
								})
							} else {
								// Record exists but incorrect reset string passed
								res.json({
									status: "FAILED",
									message: "Invalid password reset details passed."
								})
							}
						})
						.catch(err => {
							res.json({
								status: "FAILED",
								message: "Comparing password reset strings failed."
							})
						})
				}

			} else {
				// Password reset record doesn't exist
				res.json({
					status: "FAILED",
					message: "Password reset request not found"
				})
			}
		})
		.catch(err => {
			console.log(err);
			res.json({
				status: "FAILED",
				message: "Checking for existing password reset record failed"
			})
		})
})

module.exports = router;
