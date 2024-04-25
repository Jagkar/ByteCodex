const express = require('express');
const expressSession = require('express-session');
const app = express();
const path = require("path");
const router = express.Router();
require('dotenv').config();
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(expressSession);

app.use(expressSession({
    secret: 'key',
    resave: true,
    saveUninitialized: true,
    store: new MongoDBStore({
        uri: process.env.MONGODB_URI,
        collection: 'sessions'
    })
}));

// MONGOOSE
const CourseConnection = mongoose.createConnection(process.env.MONGODB_URI + "/Course");

app.use('/static', express.static('static'))

// PUG Configurations
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

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
const UserConnection = mongoose.createConnection(process.env.MONGODB_URI + "/ByteCodexUser");

const userLoginSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    enrolledCourses: { type: Array, "default": [] }
});
const User = UserConnection.model('userlogins', userLoginSchema);

router.get('/', function (req, res) {
    console.log(req.session.user)
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
                        res.status(200).render("courses.pug", params);
                    }
                    else {
                        res.status(200).render("login.pug");
                    }
                })
                .catch(err => {
                    console.error(err);
                })
        })
        .catch(err => {
            console.error(err);
        })
})

router.post('/enroll', async function (req, res) {
    const courseId = req.query.courseId;
    try {
        const user = await User.findOne({ username: req.session.user });
        if (!user) {
            return res.status(404).send('User not found');
        }
        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).send('User is already enrolled in the course');
        }
        user.enrolledCourses.push(courseId);
        await user.save();
        res.sendStatus(200);
    } catch (error) {
        console.error('Error enrolling in the course:', error);
        res.status(500).send('Error enrolling in the course');
    }
});

router.delete('/enroll', async function (req, res) {
    const courseId = req.query.courseId;
    try {
        const user = await User.findOne({ username: req.session.user });
        if (!user) {
            return res.status(404).send('User not found');
        }
        const index = user.enrolledCourses.indexOf(courseId);
        if (index === -1) {
            return res.status(400).send('User is not enrolled in the course');
        }
        user.enrolledCourses.splice(index, 1); // Remove course from enrolledCourses array
        await user.save();
        res.sendStatus(200);
    } catch (error) {
        console.error('Error unenrolling from the course:', error);
        res.status(500).send('Error unenrolling from the course');
    }
});

module.exports = router;
