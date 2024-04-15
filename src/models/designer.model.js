

const mongoose = require('mongoose');
const { Schema } = mongoose;

const DesignerSchema = new Schema({
    designerId: { type: Schema.Types.ObjectId, ref: 'users' , default : null},
    cv: { type: String },
    listImageProject : { type: Array , default: [] },
    skill : { type: Array , default: [] },
    experience : { type: Array , default: [] },
    designfile : { type: Schema.Types.ObjectId, ref: 'projectType' , default : null},
}, { timestamps: true })

module.exports = mongoose.model("designers", DesignerSchema)
  