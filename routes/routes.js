const express = require("express");
const passport = require("passport");
const User = require("../models/user");
const Task = require("../models/task");

/*TODO: define router*/
const router = express.Router();

/*TODO: make important variables available across multiple views*/
router.use(function (req, res, next){
    res.locals.currentUser = req.user;
    res.locals.infos = req.flash("info");
    res.locals.errors = req.flash("error");
    next();
});

/*TODO: verify if user have logged to access to the protected pages*/
function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        next();
    } else {
        req.flash("error", "You must login first");
        res.redirect("/users/login");
    }
}

/*TODO: routes to the index page*/
router.get("/", function (req, res){
   /*the index page show the welcome messages and request user to login or register*/
    res.render("index");
});

/*TODO: load the form for user registration*/
router.get("/users/registration", function (req, res){
    /*load the view with the user creation form*/
    res.render("users/registration");
});

/*TODO: register user from the data received from the form*/
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

/*TODO: path that will launch the login page*/
router.get("/users/login", function (req, res){
    res.render("users/login");
});

/*process user authentication [user login process]*/
router.post("/users/login", passport.authenticate("localStrategy", {
    successRedirect: "/home",
    failureRedirect: "/users/login",
    failureFlash: true
}));

/*TODO: logout process*/
router.get("/users/logout", ensureAuthenticated, function (req, res){
    req.logout();
    req.flash("info", "You have successfully logged out");
    res.redirect("/");
});

/*TODO: the path to home page*/
router.get("/home",  ensureAuthenticated, function (req, res, next){
    /*TODO: fetch the list of tasks belong to login user from the database */
    const userID = req.user._id;
    Task.find({ owner: userID }).sort({ priority: "descending" }).exec(function (error, tasks){
        if(error){ return next(error); }
        /*TODO: render the view with tasks*/
        res.render("home", { tasks: tasks });
    });
});

/*TODO: the path to launch the form for adding new task*/
router.get("/tasks/add", ensureAuthenticated, function (req, res){
    res.render("tasks/add");
});

/*TODO: the path to process the storing of task*/
router.post("/tasks/add", ensureAuthenticated, function (req, res){
   /*TODO: receive data from the form and validate the presence of required fields*/
    const owner = req.user._id;
    const title = req.body.title;
    const description = req.body.description;
    const priority = Number(req.body.priority);

    /*validate*/
    if(!title || !description){
        req.flash("error", "Title or description field can not be empty");
        res.redirect("/tasks/add");
    }

    if(title.length < 10 || description.length < 10){
        req.flash("error", "Invalid title of description length");
        res.redirect("/tasks/add");
    }

    if(priority < 0 || priority > 10){
        req.flash("error", "Task priority should be between 1 and 10");
        res.redirect("/tasks/add");
    }

    const newTask = new Task({
        owner: owner,
        title: title,
        description: description.trim(),
        priority: priority
    });

    newTask.save().then(function (){
        req.flash("info", "New task added successfully");
        res.redirect("/home");
    });
});

/*export the module to be used in other files*/
module.exports = router;

