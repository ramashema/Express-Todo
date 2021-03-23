const express = require("express");

/*define router*/
const router = express.Router();

/*routes to the public pages*/
router.get("/", function (req, res, next){
   /*the index page show the welcome messages and request user to login or register*/
    res.render("index");
});


/*export the module to be used in other files*/
module.exports = router;

