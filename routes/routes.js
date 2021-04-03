const express = require("express");
const passport = require("passport");
const User = require("../models/user");
const Task = require("../models/task");
const SubTask = require("../models/subtask");


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
    const subTasks = [];
    Task.find({ owner: userID }).sort({ priority: "descending" }).exec(function (error, tasks){
        if(error){ return next(error); }

        /*TODO: fetch subtasks*/
        SubTask.find().sort({ createdAt: "ascending" }).populate("task").exec(function (error, subtasks){
            if(error){ return next(error); }
            /*res.send(subtasks);*

            /*TODO: render the view with tasks*/
            res.render("home", { tasks: tasks, subtasks: subtasks });
        });
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

/*TODO: the path to add subtask form*/
router.get("/tasks/subtasks/add/:taskID", ensureAuthenticated, function (req, res, next){
    Task.findOne({ _id: req.params.taskID  }).exec(function (error, task){
        res.render("tasks/subtasks/add", { task: task  });
    });
});


/*TODO: the path to process the posting of the subtask in the database*/
router.post("/tasks/subtasks/add/:taskID", ensureAuthenticated, function (req, res, next){
    /*TODO: receive data from the form*/
    const taskID = req.params.taskID;
    const title = req.body.title;
    const description = req.body.description;
    const duedate = new Date(req.body.duedate);
    const today = new Date();

    /*TODO: check for empty title [TOBE refactored]*/
    if(title === "" || description === ""){
        req.flash("error", "Title or Descriptions fields can not be empty");
        res.redirect("back");
    }

    if(today.getTime() > duedate.getTime()){
        /*user choose past due date*/
        req.flash("error", "Due date can not be the date in the past");
        res.redirect("back");
    }

    /*save the subtask in the databases*/
    const newSubTask = new SubTask({
        task : taskID,
        title: title,
        description: description,
        dueAt: duedate,
    });

    newSubTask.save().then(function (){
        req.flash("info", "Subtask added successfully");
        res.redirect("/home");
    })
});

/*TODO: view individual tasks*/
router.get("/tasks/view/:taskID", ensureAuthenticated, function (req, res, next){
    Task.findById(req.params.taskID).exec(function (error, task){
        SubTask.find({ task: req.params.taskID }).sort({ createdAt: "ascending" }).exec( function (error, subtasks){
            if(error){ return next(error); }
            res.render("tasks/view", { task: task, subtasks: subtasks });
        });
    });
});

/*TODO: delete confirmation of a task a task*/
router.get("/tasks/confirm_delete/:taskID", ensureAuthenticated, function (req, res, next){
    Task.findById(req.params.taskID).exec(function (error, task){

        if(error) { return next(error); }

        if(JSON.stringify(req.user.id) === JSON.stringify(task.owner)){
            res.render("tasks/delete_confirmation", { taskID: task.id });
        } else {
            req.flash("error", "Unauthorized action");
            res.redirect("back");
        }
    });
});

/*TODO: delete a task*/
router.get("/tasks/delete/:taskID", ensureAuthenticated, function (req, res, next){

    Task.findById(req.params.taskID).exec(function (error, task){
        if(error){ return next(error); }

        /*TODO: restrict none  task owner to delete tasks*/
        if(JSON.stringify(req.user.id) === JSON.stringify(task.owner)){
            Task.deleteOne({ _id: req.params.taskID }, function (error){
                if(error){
                    req.flash("error", "Failed to delete a task");
                    res.redirect("back");
                }

                /*delete all subtasks */
                SubTask.deleteMany({ task: req.params.taskID }, function (error){
                    if(error){
                        req.flash("error", "Failed to delete subtasks");
                        res.redirect("/home");
                    }

                    req.flash("info", "Succefully delete task and it associated subtasks");
                    res.redirect("/home");
                })
            });
        } else {
            req.flash("info", "Unauthorized action");
            res.redirect("/home");
        }
    })

});

/*TODO: launch edit task view*/
router.get("/tasks/edit/:taskID", ensureAuthenticated, function (req, res, next){
    Task.findById(req.params.taskID).exec(function (error, task){
        if(error) { return next(error); }
        res.render("tasks/edit", { task: task });
    });
});

/*TODO: process task editing*/
router.post("/tasks/edit/:taskID", ensureAuthenticated, function (req, res, next){
    const title = req.body.title;
    const description = req.body.description;
    const priority = req.body.priority;

    if (title.trim() === "" || description.trim() === "" || priority.trim() === ""){
        req.flash("error", "All field are required");
        res.redirect("back");
    }

    Task.findOne({ _id: req.params.taskID }, function(error, task){
        if(error) { return next(error); }

        // Using save() to update the document has advantage over other
        task.title = title;
        task.description = description;
        task.priority = priority;

        // save the task
        task.save(function(error){
            if(error){
                return next(error);
            }

            req.flash("info", "Task updated successfully");
            res.redirect("/tasks/view/"+req.params.taskID);
        })
    })
});

/*TODO: launch the form that will update the subtask*/
router.get("/tasks/subtasks/edit/:subtaskID", ensureAuthenticated, function (req, res, next){
    SubTask.findById(req.params.subtaskID).exec(function (error, subtask){
        if(error){ return next(error);}

        if(!subtask){
            req.flash("error", "The requested project task does not exist");
            res.redirect("back");
        }

        Task.findOne({ _id: subtask.task }).exec(function (error, task){
            if(error){ return next(error); }
            res.render("tasks/subtasks/edit", { subtask: subtask, task: task });
        });
    });
});


router.post("/tasks/subtasks/edit/:subtaskID", ensureAuthenticated, function (req, res, next){
    const subtaskID = req.params.subtaskID;
    const today = new Date();
    const title = req.body.title;
    const description = req.body.description;
    const extendedTo = req.body.extendeddue;

    /*search subtask*/
    SubTask.findById(subtaskID).exec(function (error, subtask){
        if(error){ return next(error); }

        if(!subtask){
            req.flash("error", "The requested subtask does not exit");
            res.redirect("back");
        }

        /*TODO: compare dates to prevent user from entering past extended date*/
        const extendedDue = Date.parse(extendedTo);
        const subtaskDue = Date.parse(subtask.dueAt);

        if( extendedDue > subtaskDue && extendedDue >= today.getTime() ){
            subtask.title = title;
            subtask.description = description;
            subtask.extendedTo = extendedTo

            subtask.save(function (error){
                if(error){ return next(error); }

                req.flash("info", "Subtask updated succesfully");
                res.redirect("/home");
            })
        } else {
            req.flash("error", "Extended date should be later or equal to today");
            res.redirect("back");
        }
    });
});

/*delete subtask confirmation*/
router.get("/tasks/subtasks/confirm_delete/:subtaskID", function (req, res, next){
    res.render("tasks/subtasks/confirm_delete", { subtaskID: req.params.subtaskID });
});


/*TODO: delete subtask*/
router.get("/tasks/subtasks/delete/:subtaskID", ensureAuthenticated, function (req, res, next){
    const subtaskID = req.params.subtaskID;
    SubTask.findById(subtaskID).exec(function (error, subtask){
        if(error){ return next(error); }

        const taskID = subtask.task;
        Task.findById(taskID).exec(function (error, task){
            if(error){ return next(error); }

            if(JSON.stringify(req.user._id) !== JSON.stringify(task.owner)){
                req.flash("error", "Unauthorized action");
                res.redirect("/home");
            }

            SubTask.deleteOne({ _id: subtaskID }).exec(function (error){
                if(error){ return next(error); }

                req.flash("info", "Successfully deleted subtask");
                res.redirect("/tasks/view/"+task._id);
            });
        });
    });
});


/*TODO: mark subtask completion confirmation */
router.get("/tasks/subtasks/confirm_completed/:subtaskID", function (req, res, next){
    res.render("tasks/subtasks/confirm_completed", { subtaskID: req.params.subtaskID });
});

/*TODO: export the module to be used in other files*/
router.get("/tasks/subtasks/complete/:subtaskID", function(req, res, next){
    const subtaskID = req.params.subtaskID;
    SubTask.findById(subtaskID).exec(function (error, subtask){
        if(error){ return next(error); }

        const taskID = subtask.task;
        Task.findById(taskID).exec(function (error, task){
            if(error){ return next(error); }

            if(JSON.stringify(req.user._id) !== JSON.stringify(task.owner)){
                req.flash("error", "Unauthorized action");
                res.redirect("/home");
            }

            if(subtask.status === "completed"){
                req.flash("error","The subtask is already in 'Completed State'");
                res.redirect("/tasks/view/"+task._id);
            }

            subtask.status = "completed";
            subtask.save(function (error){
                if(error){ return next(error); }

                req.flash("info", "Congratulation! you have successfully completed the task");
                res.redirect("/tasks/view/"+task._id);
            });
        });
    });
});


module.exports = router;

