const express = require('express');
const expressSession = require('express-session');
const app = express();
const path = require("path");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const MongoDBStore = require('connect-mongodb-session')(expressSession);
require('dotenv').config();
app.use(bodyParser.urlencoded({ extended: false }))

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI + "/ByteCodexUser", { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Initialize MongoDBStore
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI + "/ByteCodexUser",
    collection: 'sessions'
});

// Catch errors in MongoDBStore
store.on('error', function(error) {
    console.error(error);
});

// Use express-session with MongoDBStore
app.use(expressSession({
    secret: 'key',
    resave: true,
    saveUninitialized: true,
    store: store
}));

// Define user schema and model
const userLoginSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = mongoose.model('userlogins', userLoginSchema);

app.use('/static', express.static('static'))

// PUG Configurations
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// Routes
app.get('/', function (req, res) {
    res.render("login.pug");
});
app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect("/home");
});

// Login form submission handler
app.post('/login', function (req, res) {
    const { username, password } = req.body;

    // Perform authentication (e.g., check credentials in database)
    // Redirect user to appropriate page
    try {
        User.findOne({ username: username })
            .then(user => {
                if (user && user.password === password) {
                    req.session.user = username;
                    res.redirect('/home');
                } else {
                    res.status(401).send('Invalid username or password');
                }
            })
            .catch(err => {
                console.error("Error:", err);
                res.status(401).send('An error occurred');
            });
    } catch (err) {
        console.error(err);
    }
});

app.post('/signup', function (req, res) {
    const { username, email, password } = req.body;

    const newUser = new User({
        username: username,
        email: email,
        password: password
    });
    try {
        newUser.save();
        req.session.user = username;
        res.redirect('/home');
    } catch (err) {
        console.error(err);
    }
});

app.get('/home', function (req, res) {
    if (req.session.user) {
        res.render('home.pug', { login: true, username: req.session.user });
    } else {
        res.render('home.pug', { login: false });
    }
});

module.exports = app;
