const mongoose = require("mongoose");
const chatRoomSchema = new mongoose.Schema({
    name:{
        type: String
    },
    messages: {
        type: Array
    },
    imagePath: {
        type: Array
    }

    });

   
    mongoose.model('chatRoom', chatRoomSchema);
