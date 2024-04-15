
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MeesageChatSchema = new Schema({
    idCustomer: { type: Schema.Types.ObjectId, ref: 'users', default: null },
    idStaff: { type: Schema.Types.ObjectId, ref: 'users', default: null },
    message: { type: String, default: "" },
    image: { type: Array, default: [] },
    file: { type: Array, default: [] },
    time: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model("messagechats", MeesageChatSchema)
