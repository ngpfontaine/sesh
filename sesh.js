/*

/ Login form
POST to /login
Authenticate with Passport
GET /success or /fail
GET to /success checks for cookie
If no or invalid cookie, redirect to /cookie-fail

*/

"use strict"

const express = require("express"),
  session = require("express-session"),
  cookieSession = require("cookie-session"),
  FileStore = require("session-file-store")(session),
  connect = require("connect-ensure-login"),
  passport = require("passport"),
  // cookieParser = require("cookie-parser"),
  Strategy = require("passport-local").Strategy,
  app = express(),
  port = 3341,
  nanoid = require('nanoid'),
  db = require('./db')

passport.serializeUser(function(user, cb) {
  cb(null, user.id)
})
passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err) }
    cb(null, user)
  })
})
passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {
      if (err) {return cb(err) }
      if (!user) { return cb(null, false) }
      if (user.password != password) { return cb(null, false) }
      return cb(null, user) // Sucess
    })
  }
))

app.use(require("body-parser").urlencoded({ extended: true }))
// app.use(cookieParser("secret"))

// Express Session
app.set("trust proxy", 1)
app.use(session({
  proxy: true,
  name: "name-" + nanoid(6),
  store: new FileStore(),
  secret: "secret",
  domain: "sesh.junk.cool",
  cookie: {
    secure: true,
    httpOnly: true
  },
  saveUninitialized: true,
  resave: false
}))


// Cookie Session
// app.use(cookieSession({
//   name: "cookieSession",
//   keys: ["secret"],
//   secure: true,
//   httpOnly: true, // default
//   signed: true, //default
//   overwrite: true //default
// }))

app.use(passport.initialize())
app.use(passport.session())

// Send pre-populated login form
app.get("/", function(req,res) {
  // res.cookie("tc-01","secure-httpOnly", {secure: true, httpOnly: true})
  // res.cookie("tc-02","secure-httpOnly-signed", {secure: true, httpOnly: true, signed: true})
  res.send("<html><head><meta charset='UTF-8'></head><body>" + 
    "<form action='/login' method='post'>" +
      "<input name='username' value='username'><br>" +
      "<input name='password' value='password'><br>" +
      "<input type='submit' value='LOGIN'>" +
    "</form>" +
  "</body>" +
  "</html>")
})

// Authenticate credentials
app.post("/login",
  passport.authenticate('local', {
    successRedirect: "/success",
    failureRedirect: "/fail"
  })
)

// Authentication required to view
app.get("/success",
  connect.ensureLoggedIn("/cookie-fail"),
  function(req,res) {
    res.setHeader("Content-Type", "text/html")
    res.send("Authentication Success<br>" +
      "<a href='./'>Back</a><br>")
  })

// Auth failed
app.get("/fail",
  function(req,res) { res.send("Authentication Fail<br>" +
    "<a href='./'>Back</a>") })

// Cookie auth failed
app.get("/cookie-fail",
  function(req,res) { res.send("Authentication Success, But Cookie Authentication Fail<br>" +
    "<a href='./'>Back</a>") })

app.listen(port, (err) => {
  if (err) { return console.log('node: something bad happened', err) }
  console.log('node: server is listening on ' + port)
})
