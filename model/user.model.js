const mongoose = require("mongoose");
const UserSchema = mongoose.Schema({
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
    location: {
        type : {
            type: String
        },
        coordinates:[String, String]
        }

    });

   
 module.exports = mongoose.model('User', UserSchema);
