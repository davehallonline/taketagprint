const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require("cors");
require('dotenv').config();

const passport = require('passport');
//const InstagramStrategy = require('passport-instagram').Strategy;
const InstagramStrategy = require('./strategy');//.Strategy;

const middlewares = require("./middlewares");
const { xssFilter } = require('helmet');
const { serializeUser } = require('passport');

const app = express();
app.use(morgan('common'));
app.use(helmet());
app.use(cors({
    origin: 'https://taketagprint.heroku.com'
}));

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(obj, done){
    done(null, obj);
});

passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: 'https://taketagprint.herokuapp.com/auth/instagram/callback'
},
function(accessToken, refreshToken, profile, done){
    User.findOrCreate({ instagramId: profile.id }, function(err, user) {
        return done(err, user);
    });
}
));

//app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    // app.use(express.logger());
    // app.use(express.cookieParser());
    // app.use(express.bodyParser());
    // app.use(express.methodOverride());
    // app.use(express.session({ secret: 'keyboard cat' }));
    // // Initialize Passport!  Also use passport.session() middleware, to support
    // // persistent login sessions (recommended).
     app.use(passport.initialize());
     app.use(passport.session());
    // app.use(app.router);
    // app.use(express.static(__dirname + '/public'));
  //});


app.get('/', function(req, res){
    res.render('index', { user: req.user });
  });
  
  app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
  });
  
  app.get('/login', function(req, res){
    res.render('login', { user: req.user });
  });

app.get('/auth/instagram', passport.authenticate('instagram', { scope: ['user_profile','user_media'] }));

app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }),
function(req, res) {
    //successful auth redirect home
    res.redirect('/')
})

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

app.use(middlewares.notFound);

app.use(middlewares.errorHandler);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
  }

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
