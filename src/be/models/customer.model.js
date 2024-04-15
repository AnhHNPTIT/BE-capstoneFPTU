// customer.model.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Email là duy nhất
    },
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Customer', customerSchema);
