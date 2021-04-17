const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookie = require("cookie-parser");
const flash = require("express-flash");
const ms = require("ms");
const mongoose = require("mongoose");
const passport = require("passport");


const routes = require("./routes/routes");
const passportConfigurations = require("./config/passportConfig");


/*define the app*/
const app = express();
const db = mongoose.connection;

/*define the port that the app should listen*/
app.set("port", process.env.PORT || 3000);

/*log every request that is coming from the client*/
app.use(logger("common"));

/*connect to the mongodb*/
mongoose.connect("mongodb://localhost:27017/express_todo",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        poolSize: 10
    });

/*capture any error if there is any connection error*/
db.on("error", console.error.bind(console, "Mongodb connection error:"));

/*let admin know that the connection is success*/
db.once("open", function (){
    console.info("Successfully connected to the database");
});

/*import passport configurations*/
passportConfigurations();

/*set the view engine and view directory*/
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

/*use body parser middleware for parsing form content in post request*/
app.use(bodyParser.urlencoded({ extended: true }));

/*use cookie parser*/
app.use(cookie());

/*use session*/
app.use(session({
    secret: "superSecret",
    saveUninitialized: false,
    resave: false
}));

/*initialize passport middleware for login process authentication*/
app.use(passport.initialize());
app.use(passport.session());

/*use flash for flash messages*/
app.use(flash());

/*use the routes that will determine the user request and the pages to be sent*/
app.use(routes);

app.listen(app.get("port"), function (){
    console.log(`The server is running on http://localhost:${app.get("port")}`);
});