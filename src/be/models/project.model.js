

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectSchema = new Schema({
    name: { type: String },
    projectIdType :  { type: Schema.Types.ObjectId, ref: 'users' ,default : null},
    projectImage : { type: String },
    designerId  :{ type: Schema.Types.ObjectId, ref: 'designers' ,default : null},
    designerDate :  { type : Date},
    constructionDate :  { type : Date},
    catalog :  { type : String},
    description:  { type : String}
}, { timestamps: true })

module.exports = mongoose.model("project", ProjectSchema)
