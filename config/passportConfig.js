const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;

const User = require("../models/user");


module.exports = function () {
    /*serialization of users*/
    passport.serializeUser(function (user, done){
        done(null, user._id);
    });

    /*deserialization of user*/
    passport.deserializeUser(function (id, done){
        User.findById(id, function (err, user){
            done(err, user);
        });
    });
};

passport.use("localStrategy", new LocalStrategy({
    usernameField: "email"
}, function (email, password, done){
        /*check if user name exist in the database*/
        User.findOne({ email: email }, function (error, user){
            if(error) { return done(error); }
            if(!user){
                return done(null, false, {
                    message: "User does not exist!"
                });
            }

            /*if user do exist verify his/her password*/
            user.checkPassword(password, function (error, isMatch){
                if(error) { return done(error); }
                if(isMatch){
                    return done(null, user);
                }

                /*if the provided password is not valid*/
                return done(null, false, {
                    message: "Invalid password, please try again"
                });
            });
        });
    }
));

