const express=require("express");
const app=express();
require('dotenv').config();

const path=require("path");

app.use('/static',express.static('static'))

// PUG Configurations
app.set('view engine','pug')
app.set('views',path.join(__dirname,'views'))

app.get("/",(req,res)=>{
    res.status(200).redirect("/home");
})
const Login=require(`${__dirname}/login.js`);
app.use(Login);
app.use('/login',Login);

// Courses page rendering
const Courses=require(`${__dirname}/courses.js`);
app.use(Courses);
app.use('/courses',Courses);

// Profile page rendering
const Profile=require(`${__dirname}/profile.js`);
app.use(Profile);
app.use('/profile',Profile);

app.listen(process.env.PORT,()=>{
    console.log(`The application started successfully on port ${process.env.PORT}`);    
})

