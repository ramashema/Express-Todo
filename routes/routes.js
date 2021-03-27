const express = require("express");
const passport = require("passport");
const User = require("../models/user");

/*define router*/
const router = express.Router();

/*make important variables available across multiple views*/
router.use(function (req, res, next){
    res.locals.currentUser = req.user;
    res.locals.infos = req.flash("info");
    res.locals.errors = req.flash("error");
    next();
});

/*the function to verify if user have logged to access to the protected pages*/
function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        next();
    } else {
        req.flash("error", "You must login first");
        res.redirect("/users/login");
    }
}

/*routes to the public pages*/
router.get("/", function (req, res){
   /*the index page show the welcome messages and request user to login or register*/
    res.render("index");
});

/*load the form for user registration*/

router.get("/users/registration", function (req, res, next){
    /*load the view with the user creation form*/
    res.render("users/registration");
});

/*register user from the data received from the form*/

router.post("/users/registration", function (req, res, next){
    /*receive data from the form*/
        const firstname = req.body.firstname;
        const middlename = req.body.middlename;
        const lastname = req.body.lastname;
        const email = req.body.email;
        const password = req.body.password;

       /*check if user do exist in the system*/
        User.findOne({ email: email }, function (error, user){
            if(error){ return next(error); }

            if(user){
                req.flash("error", "User already exist");
                return res.redirect("/users/registration");
            }

            const newUser = new User({
                firstname: firstname,
                middlename: middlename,
                lastname: lastname,
                email: email,
                password: password,
            });

            /*store user in the database*/
            newUser.save().then(function (){
                req.flash("info", "User registration is successfully");
                res.redirect("/users/login");
            });
        });
});

/*path that will launch the login page*/
router.get("/users/login", function (req, res, next){
    res.render("users/login");
});

/*process user authentication [user login process]*/
router.post("/users/login", passport.authenticate("localStrategy", {
    successRedirect: "/home",
    failureRedirect: "/users/login",
    failureFlash: true
}));

/*logout process*/
router.get("/users/logout", ensureAuthenticated, function (req, res){
    req.logout();
    req.flash("info", "You have successfully logged out");
    res.redirect("/");
});



/*the path to home page*/
router.get("/home",  ensureAuthenticated, function (req, res){
    res.render("home");
});



/*export the module to be used in other files*/
module.exports = router;

