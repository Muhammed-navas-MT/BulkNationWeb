const express= require("express");
const app= express();
const path =require("path");
const nocache = require('nocache');
const session = require("express-session");
const env = require("dotenv").config()
const passport = require("./config/passport")
const db=require("./config/db");
const exp = require("constants");
const passportToUser = require('./middlewares/passportToUser').passportToUser
db();


// build in middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(nocache());
app.use(session({
  secret: process.env.SESSION_SECRET,//SESSION_SECRET ||
  resave:false,
  saveUninitialized:true,
  cookie:{
    secure:false,
    httpOnly:true,
    maxAge:72*60*60*1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(passportToUser)
const userRouter=require("./routers/userRouter");
const adminRouter =require("./routers/adminRouter")



// set the view engine
app.set("views", [
    path.join(__dirname, "views/user"),
    path.join(__dirname, "views/admin")
  ]);

app.set("view engine","ejs");

app.use("/",userRouter);
app.use("/admin",adminRouter);



app.listen(process.env.PORT,()=>console.log("server is running port 3000"));


module.exports=app;