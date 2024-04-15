

const mongoose = require('mongoose');
const { Schema } = mongoose;

const CategoriesSchema = new Schema({
    categoriesName: { type: String },
    images :  {type: [String],},
    projectIds :  {type : Schema.Types.ObjectId, ref: 'project' , default : null},
}, { timestamps: true })

module.exports = mongoose.model("categories", CategoriesSchema)
 