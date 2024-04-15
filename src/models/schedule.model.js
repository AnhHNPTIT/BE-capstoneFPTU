const mongoose = require('mongoose');
const { Schema } = mongoose;
const { enum_status_schedule, time_select_schedule } = require("../common/enum.database")

const ScheduleSchema = new Schema({
    designerId: { type: Schema.Types.ObjectId, ref: 'designers' },
    customerId: { type: Schema.Types.ObjectId, ref: 'customer', default: null },
    description_off: {
        type: String,
        default: ""
    },
    description_book: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: enum_status_schedule,
        default: "NULL"
    },
    isSelectBook: {
        type: Boolean,
        default: false
    },
    workOn: {
        type: Boolean,
        default: false
    },
    timeSelect: {
        type: String,
        enum: time_select_schedule,
        default: "NULL"
    },
    timeWork: {
        type: String,
        default: ""
    },
    phoneNumber: {
        type: String
    },
    email: {
        type: String,
    },
    place: {
        type: String,
    }
}, { timestamps: true })

module.exports = mongoose.model("schedule", ScheduleSchema)
