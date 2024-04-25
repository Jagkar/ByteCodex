const express = require('express');
const expressSession = require('express-session');
const app = express();
const path = require("path");
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const { log } = require('console');
require('dotenv').config();
app.use(bodyParser.urlencoded({ extended: false }))
// const router=express.Router();

app.use(expressSession({
    secret: 'key',
    resave: true,
    saveUninitialized: true
}))
// Connect to MongoDB
var UserConnection = mongoose.createConnection(process.env.MONGODB_URI + "/ByteCodexUser");

// Define user schema and model
const userLoginSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = UserConnection.model('userlogins', userLoginSchema);

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
        User.find({ username: username })
            .then(doc => {
                if (doc[0].password == password) {
                    req.session.user = username;
                    // res.render('home.pug',params);
                    res.redirect('/home');
                }
                else {
                    // Authentication failed
                    res.status(401).send('Invalid username or password');
                }
            })
            .catch(err => {
                console.error("No such user found");
                res.status(401).send('No such user');
            })
    
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
        console.log(username);
        req.session.user = username;
        res.redirect('/home');
    } catch (err) {
        console.error(err);
    }
});
app.get('/home', function (req, res) {
    console.log(req.session.user);
    if (req.session.user) {
        d = { login: true, username: req.session.user }
        params = { data: JSON.stringify(d) };
        res.render('home.pug', params);
    }
    else {
        d = { login: false }
        params = { data: JSON.stringify(d) };
        res.render('home.pug', params);
    }
});

module.exports = app;