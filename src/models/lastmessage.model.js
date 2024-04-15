
const mongoose = require('mongoose');
const { Schema } = mongoose;


// file is pdf ,worf , txt
//
const LastMeesageSchema = new Schema({
    idCustomer: { type: Schema.Types.ObjectId, ref: 'users', default: null },
    idStaff: { type: Schema.Types.ObjectId, ref: 'users', default: null },
    message: { type: String, default: "" },
    image: { type: Array, default: [] },
    file: { type: Array, default: [] },
    pinned: { type: Boolean, default: false },
    time: { type: Date },
    unread: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model("lastmessage", LastMeesageSchema)
