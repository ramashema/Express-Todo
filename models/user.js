const mongoose = require("mongoose");
const { Schema } = mongoose;
require("mongoose-type-email");
const bcrypt = require("bcrypt-nodejs");

/*create user model*/
const userSchema = new Schema({
    firstname: { type: String, required: true },
    middlename: { type: String },
    lastname: { type: String, required: true },
    email: { type: mongoose.SchemaTypes.Email, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

/*encrypt the password before user has been created*/
userSchema.pre("save", function (done){
    const user = this;
    const saltFactor = 10;
    /*check if user is changing the password, if yes encrypt if not then the password is not created nor modified*/
    if( user.isModified("password") ){
        /*generate the password salt*/
        bcrypt.genSalt(saltFactor, function (error, salt){
            if( error ) {
                return done(error);
            }

            bcrypt.hash(user.password, salt, function (error, hashedPassword){
                if(error) { return done(error); }
                /*now the user password will be that hashed password*/
                user.password = hashedPassword;
            });
        });
    }
});

/*check the password when the user is trying to login*/
userSchema.methods.checkPassword = function (guessedPassword, done){
    bcrypt.compare(guessedPassword, this.password, function (error, isMatch){
        done( error, isMatch );
    });
};

/*return the full name of the user*/
userSchema.methods.getFullName = function (){
    return `${this.firstname} ${this.lastname}` || `${this.email}`;
};

/*create the model from the schema and export the model as module to be used by other file*/
const User = mongoose.model("User", userSchema);
module.exports = User;
