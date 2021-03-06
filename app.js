//dependencies
//const express = require('express');
//const expressValidator = require('express-validator');
//const bodyParser = require('body-parser');
//const mustache = require('mustache');
//const mustacheExpress = require('mustache-express');
//const parseurl = require('parseurl');
//const path = require('path');
//const session = require('express-session');
//const data = require('./user_data.js');



//var app = express();



//app.engine('mustache', mustacheExpress());
//app.set('views', './views');
//app.set('view engine', 'mustache');
//app.use(express.static( __dirname + '/public'));

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));

//app.use(session({
//  secret: 'keybord cat',
//  resave: false,
//  saveUninitialized: true
//}));



//app.use(function (req, res, next) {
//  var views = req.session.views;

//  if (!views) {
//    views = req.session.views = {};
//  }

//next();

//})

//function authenticate(req, username, password) {
//  var authenticatedUser = data.users.find(function (user) {
//    if (username === user.username && password === user.password) {
//      req.session.authenticated = true;
//      console.log('User & Password Authenticated');
//    } else {
//      return false
//    }
//  });
//  console.log(req.session);
//  return req.session;
//}



//Listening on root
//app.get('/login', function (req, res) {
//  if (req.session && req.session.authenticated) {
//    res.render('index', {username: req.session.username});
//  } else {
//    res.render('index');
//  }
//});

//app.get('/login', function(req, res) {
//  res.render('index');
//});

//app.get('/', function(req, res){
//  res.sendFile(path.join(__dirname + '/index.mustache'));


//app.post('/', function(req, res) {
//  var username = req.body.username;
//  var password = req.body.password;
//  authenticate(req, username, password);
//  if (req.session && req.session.authenticated) {
//    res.render('welcome', { username: username });
//  } else {
//    res.redirect('/');
//  }
//})






//app.listen(3000, function () {
//  console.log('Successfully started express application!');
//});








const fs = require('fs');
const path = require('path');
const express = require('express');
const mustacheExpress = require('mustache-express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bodyParser = require('body-parser');
const models = require("./models/users");
const flash = require('express-flash-messages');
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const User = models.User;
const Snippet = require('./models/snippets');

const app = express();

mongoose.connect('mongodb://localhost:27017/test');
mongoose.Promise = require('bluebird');

app.engine('mustache', mustacheExpress());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');
app.set('login', 'login');
app.use('/static', express.static('static'));

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.authenticate(username, password, function(err, user) {
            if (err) {
                return done(err)
            }
            if (user) {
                return done(null, user)
            } else {
                return done(null, false, {
                    message: "There is no user with that username and password."
                })
            }
        })
    }));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(expressValidator());


app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new(require('express-sessions'))({
        storage: 'mongodb',
        instance: mongoose, // optional
        host: 'localhost', // optional
        port: 27017, // optional
        db: 'snippets', // optional
        collection: 'sessions', // optional
        expire: 86400 // optional
    })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
})

app.get('/favicon.ico', function(req, res) {
  res.status(204);
})


app.get('/', function(req, res) {
    res.render("index");
})

app.get('/login/', function(req, res) {
    res.render("login", {
        messages: res.locals.getMessages()
    });
});

app.post('/login/', passport.authenticate('local', {
    successRedirect: '/collection/',
    failureRedirect: '/login/',
    failureFlash: true
}))

app.get('/register/', function(req, res) {
    res.render('register');
});

app.post('/register/', function(req, res) {
    req.checkBody('username', 'Username must be alphanumeric').isAlphanumeric();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();

    req.getValidationResult()
        .then(function(result) {
            if (!result.isEmpty()) {
                return res.render("register", {
                    username: req.body.username,
                    errors: result.mapped()
                });
            }
            const user = new User({
                username: req.body.username,
                password: req.body.password
            })

            const error = user.validateSync();
            if (error) {
                return res.render("register", {
                    errors: normalizeMongooseErrors(error.errors)
                })
            }

            user.save(function(err) {
                if (err) {
                    return res.render("register", {
                        messages: {
                            error: ["That username is already taken."]
                        }
                    })
                }
                return res.redirect('/');
            })
        })
});

function normalizeMongooseErrors(errors) {
    Object.keys(errors).forEach(function(key) {
        errors[key].message = errors[key].msg;
        errors[key].param = errors[key].path;
    });
}

app.get('/logout/', function(req, res) {
    req.logout();
    res.redirect('/');
});

const requireLogin = function (req, res, next) {
  if (req.user) {
    next()
  } else {
    res.redirect('/login/');
  }
}

//app.get('/secret/', requireLogin, function (req, res) {
//  res.render("secret");
//})
app.get('/collection/', requireLogin, function (req, res) {
  Snippet.find().then(function(snippets){
    res.render("collection", {snippets:snippets})
  })
});

app.get('/create', requireLogin, function(req,res){
  res.render('create');
})

app.post('/create', requireLogin, function(req,res){

  Snippet.create({
    "title": req.body.title,
    "snippetBody": req.body.snippetBody,
    "notes": req.body.notes,
    "language": req.body.language,
    "tags": req.body.tags
  })
  .then(function(snippets){
    res.redirect('/collection/')
  })
})

app.post('/:id/delete', requireLogin, function(req,res){
  Snippet.deleteOne({_id:req.params.id}).then(function(snippets){
    res.redirect('/collection/')
  })
})

app.get("/:id/edit", requireLogin, function(req,res){
  Snippet.findOne({_id:req.params.id}).then(function(snippets){
    res.render('edit', {snippets:snippets})
  })
})

app.post('/:id/edit', requireLogin, function (req,res){
  Snippet.updateOne({_id:req.params.id},
  {
    "title": req.body.title,
    "snippetBody": req.body.snippetBody,
    "notes": req.body.notes,
    "language": req.body.language,
    "tags": req.body.tags
  })
  .then(function(update){
    res.redirect('/collection/');
  });
});

app.get('/:id', requireLogin, function(req,res){
  Snippet.findOne({_id:req.params.id}).then(function(snippet){
    res.render('individual', {snippets:snippets})
  })
})



module.exports = app;






app.listen(3000, function() {
    console.log('Successfully started express application!')
});
