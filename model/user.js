const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    location: "2d"

    });

   
const users = module.exports = mongoose.model('users', userSchema);
