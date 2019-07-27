const mongoose = require("mongoose");
var users = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    email: {
        type: String
    },
    password: {
        type: String,
        required: true
    }
    });

   
    module.exports = mongoose.model("users", users);
