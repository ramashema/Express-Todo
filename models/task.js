const mongoose = require("mongoose");
const { Schema } = mongoose;

/*This is the project*/
const taskSchema = new Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: Number, required: true },
    createAt: { type: Date, default: Date.now },
});

/*create model and export the model to be used*/
const Task = mongoose.model("Task", taskSchema);
module.exports = Task;