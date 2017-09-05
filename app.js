//dependencies
const express = require('express');
const expressValidator = require('express-validator');
const bodyParser = require('body-parser');
const mustache = require('mustache');
const mustacheExpress = require('mustache-express');
const parseurl = require('parseurl');
const path = require('path');
const session = require('express-session');
const data = require('./user_data.js');



var app = express();



app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');
//app.use(express.static( __dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: 'keybord cat',
  resave: false,
  saveUninitialized: true
}));



app.use(function (req, res, next) {
  var views = req.session.views;

  if (!views) {
    views = req.session.views = {};
  }

next();

})

function authenticate(req, username, password) {
  var authenticatedUser = data.users.find(function (user) {
    if (username === user.username && password === user.password) {
      req.session.authenticated = true;
      console.log('User & Password Authenticated');
    } else {
      return false
    }
  });
  console.log(req.session);
  return req.session;
}



//Listening on root
app.get('/login', function (req, res) {
  if (req.session && req.session.authenticated) {
    res.render('index', {username: req.session.username});
  } else {
    res.render('index');
  }
});

app.get('/login', function(req, res) {
  res.render('index');
});

//app.get('/', function(req, res){
//  res.sendFile(path.join(__dirname + '/index.mustache'));


app.post('/', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  authenticate(req, username, password);
  if (req.session && req.session.authenticated) {
    res.render('welcome', { username: username });
  } else {
    res.redirect('/');
  }
})






app.listen(3000, function () {
  console.log('Successfully started express application!');
});
