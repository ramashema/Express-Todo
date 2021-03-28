const mongoose = require("mongoose");
const { Schema } = mongoose;

/*define the schema for the model*/
const subTaskSchema = new Schema({
    task : { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    title: { type: String, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now },
    dueAt: Date,
    extendedTo: Date
});

/*create and export the model for use*/
const SubTask = mongoose.model("SubTask", subTaskSchema);
module.exports = SubTask;