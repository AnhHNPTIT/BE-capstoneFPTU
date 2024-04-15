

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectTypeSchema = new Schema({
    nameProjectType: { type: String },
}, { timestamps: true })

module.exports = mongoose.model("projectType", ProjectTypeSchema)
