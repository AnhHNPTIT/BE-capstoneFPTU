

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { enum_role } = require("../common/enum.database")

const UserSchema = new Schema({
    fullName: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String
    },
    userCode: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    dob: {
        type: Date,
        default: ""
    },
    imageUser: {
        type: String,
        default: ""
    },
    gender: {
        type: String
    },
    code_change_password: {
        type: String,
        default: ""
    },
    phoneNumber: {
        type: String
    },
    description: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: enum_role,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDelete: {
        type: Boolean,
        default: false
    },

}, { timestamps: true })

module.exports = mongoose.model("users", UserSchema)
