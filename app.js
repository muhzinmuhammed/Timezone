//jhgkparrriirirrasdf
const express = require("express");
const app = express();
const session = require("express-session");
const morgan = require('morgan')
const concetDB = require("./config/connection");
require("dotenv").config();



const paypal=require('paypal-rest-sdk')

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

const path = require("path");

//set template engine
app.set("view engine", "ejs");
const nocashe = require("nocache");
app.use(morgan('dev'))
app.use(nocashe());

//set public page
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my secret ",
    saveUninitialized: true,

    resave: false,
  })
);

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});
paypal.configure({
  'mode':'sandbox',
  'client_id':PAYPAL_CLIENT_ID,
  'client_secret':PAYPAL_CLIENT_SECRET
  
})
//upload file show

app.use(express.static("uploads"));

//body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/", require("./router/admin_router"));
app.use("/", require("./router/user_router"));

app.listen(3000);
