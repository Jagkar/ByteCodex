const express = require('express');
const bodyParser = require('body-parser'); // Add body-parser middleware
const expressSession = require('express-session');
const nodemailer = require('nodemailer'); // Add nodemailer for sending emails
const crypto = require('crypto'); // Add crypto module for generating verification tokens
const app = express();
const path = require("path");
const router = express.Router();
require('dotenv').config();

app.use(expressSession({
    secret: 'key',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.json()); // Parse JSON bodies

// MONGOOSE
const mongoose = require('mongoose');
var CourseConnection = mongoose.createConnection(process.env.MONGODB_URI + "/Course");

app.use('/static', express.static('static'));

// PUG Configurations
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// SCHEMA
// COURSE
const courseSchema = new mongoose.Schema({
    name: String,
    domain: String,
    duration: String,
    desc: String
});
const Course = CourseConnection.model('courses', courseSchema);

// USER
var UserConnection = mongoose.createConnection(process.env.MONGODB_URI + "/ByteCodexUser");

const userLoginSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    enrolledCourses: { type: Array, "default": [] },
    verifiedEmail: { type: Boolean, default: false }, // Add verifiedEmail field
    verificationToken: String // Add verificationToken field
});

const User = UserConnection.model('userlogins', userLoginSchema);

router.get('/', function (req, res) {
    params = {}
    Course.find()
        .then(doc => {
            User.findOne({ username: req.session.user })
                .then(userdoc => {
                    if (req.session.user) {
                        d = {
                            title: 'Title',
                            sub: true,
                            data: doc,
                            login: true,
                            username: req.session.user,
                            userInfo: userdoc
                        };
                        params = { obj: JSON.stringify(d) };
                        res.status(200).render("profile.pug", params);
                    }
                    else {
                        res.status(200).render("login.pug");
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                })
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        })
});
app.use(express.json());

// DELETE route for deleting the user account
router.delete('/deleteAccount', function (req, res) {
    // Find the user by username and delete it
    User.findOneAndDelete({ username: req.session.user })
        .then(deletedUser => {
            if (deletedUser) {
                // If the user was found and deleted
                req.session.destroy(); // Destroy the session
                res.sendStatus(200); // Send success response
            } else {
                // If the user was not found
                res.status(404).send('User not found');
            }
        })
        .catch(err => {
            console.error('Error deleting account:', err);
            res.status(500).send('Error deleting account');
        });
});

// Update username
router.post('/updateUserName', function (req, res) {
    const newUsername = req.query.newUserName;
    if (newUsername) {
        User.findOneAndUpdate(
            { username: req.session.user },
            { username: newUsername },
            { new: true }).then(
            function (doc, err) {
                if (err) {
                    console.error('Error updating username:', err);
                    res.status(500).send('Error updating username');
                } else {
                    console.log('Username updated successfully:', doc.username);
                    req.session.user = newUsername; // Update session username
                    res.status(200).send('Username updated successfully');
                }
            }
        );
    } else {
        res.status(400).send('Invalid request');
    }
});

// Update email
router.post('/updateEmail', function (req, res) {
    const newEmail = req.query.newEmail;
    if (newEmail) {
        User.findOneAndUpdate(
            { username: req.session.user },
            { email: newEmail },
            { new: true }).then(
            function (doc, err) {
                if (err) {
                    console.error('Error updating email:', err);
                    res.status(500).send('Error updating email');
                } else {
                    console.log('Email updated successfully:', doc.email);
                    res.status(200).send('Email updated successfully');
                }
            }
        );
    } else {
        res.status(400).send('Invalid request');
    }
});

const transporter = nodemailer.createTransport({
    service: 'Gmail', // e.g., Gmail, Outlook, etc.
    auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD
    }
});
const verificationEmailTemplate = (verificationLink) => `
    <p>Please click the following link to verify your email address:</p>
    <a href="${verificationLink}">${verificationLink}</a>
`;
// Add a route to send verification emails
router.post('/sendVerificationEmail', async (req, res) => {
    try {
        console.log(req.query.email);
        const email = req.query.email;
        console.log(email);
        // Generate a unique verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Save the verification token to the user's profile or database
        // For simplicity, assuming the user is already registered and their data is accessible
        const user = await User.findOneAndUpdate(
            { email },
            { verificationToken },
            { new: true }
        );

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Construct the verification link
        const verificationLink = `${MY_WEBSITE_URL}/verify-email?token=${verificationToken}`;

        // Send the verification email
        await transporter.sendMail({
            from: process.env.GMAIL_USERNAME,
            to: email,
            subject: 'Email Verification',
            html: verificationEmailTemplate(verificationLink)
        });

        res.status(200).send('Verification email sent');
    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).send('Error sending verification email');
    }
});

// Add a route to handle email verification
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        // Find the user by the verification token
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(404).send('Invalid or expired verification token');
        }

        // Mark the user's email as verified
        user.verifiedEmail = true;
        user.verificationToken = undefined; // Clear the verification token
        await user.save();

        res.status(200).send('Email verification successful');
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).send('Error verifying email');
    }
});



module.exports = router;
