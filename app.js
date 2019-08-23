const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const socket = require('socket.io');
const mail = require("./mail/mail");
var assert = require('assert');
var fs = require('fs');
// require("./model/db");
// const mongoose = require("mongoose");
// const users = mongoose.model("User");
const cors = require('cors');
const siofu = require('socketio-file-upload');
const path = require('path');
const bcrypt = require("bcryptjs");
///////////////////MULTER//////////
var multer = require('multer');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + file.originalname)
    }
});
var upload = multer({ storage: storage });

/////////////////////////////////////////////////
var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}

const app = express();
require('dotenv').config();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("./public"));
let value = false;
const port = 3000;
let users;
let count;
let messages = [];

const SECRET_KEY = process.env.SECRET_KEY;
const MongoClient = mongodb.MongoClient;

MongoClient.connect('mongodb://localhost:27017/WeChat', { useNewUrlParser: true }, (err, Database) => {
    if (err) {
        console.log(err);
        return false;
    }
    console.log("Connected to MongoDB");
    const db = Database.db("WeChat");
    users = db.collection("users");
    chatRooms = db.collection("chatRooms");
    groupChat = db.collection("groupChat");
    const server = app.listen(port, () => {
        console.log("Server started on port" + port + "...");
    });
    const io = socket.listen(server);

    io.sockets.on('connection', (socket) => {
        socket.on('join', (data) => {
            socket.join(data.room);
            chatRooms.find({}).toArray((err, rooms) => {
                if (err) {
                    console.log(err);
                    return false;
                }
                count = 0;
                rooms.forEach((room) => {
                    if (room.name == data.room) {
                        count++;
                    }
                });
                if (count == 0) {
                    chatRooms.insertOne({ name: data.room, messages: [], imagePath: [] });
                }
            });
        });


        socket.on('message', (data) => {
            io.in(data.room).emit('new message', { user: data.user, message: data.message });
            chatRooms.updateOne({ name: data.room }, { $push: { messages: { user: data.user, message: data.message } } }, (err, res) => {
                if (err) {
                    console.log(err);
                    return false;
                }
                console.log("Document updated");
            });
        });
        socket.on('typing', (data) => {
            socket.broadcast.in(data.room).emit('typing', { data: data, isTyping: true });

        // ////////////////////////Image send
        io.sockets.on('connection', function(socket){
            fs.readFile(__dirname + '/public/uploads', function(err, buf){
              // it's possible to embed binary data
              // within arbitrarily-complex objects
              socket.emit('image', { image: true, buffer: buf.toString('base64') });
              console.log('image file is initialized');
            });
          });

          socket.on("image", function(info) {
            if (info.image) {
              var img = new Image();
              img.src = 'data:image/jpeg;base64,' + info.buffer;
        
            }
          });


        // socket.on('image', (data) => {
        //     io.in(data.room).emit('new image', { user: data.user, image: data.image, });
        //     const uploader = new siofu();
        //     uploader.dir = path.join(__dirname, './public/uploads');
        //     chatRooms.updateOne({ name: data.room }, { $push: { imagePath: { user: data.user, image: data.image } } }, (err, res) => {
        //         if (err) {
        //             console.log(err);
        //             return false;
        //         }
        //         console.log("Document updated");
        //     });
        // });

       
        });
    });
});

app.get('/', (req, res, next) => {
    res.send('Welcome to the express server...');
});

app.post('/api/fileUpload', upload.single('photo'), (req, res, next) => {
    MongoClient.connect('mongodb://localhost:27017/WeChat', (err, db) => {
        assert.equal(null, err);
        insertDocuments(db, './public/uploads/' + req.file.filename, () => {
            db.close();
            res.json({ 'message': 'File uploaded successfully' });
        });
    });
});

var insertDocuments = function (db, filename, callback) {
    console.log(filename);
    chatRooms.insertOne({ imagePath: filename }, (err, result) => {
        assert.equal(err, null);
        callback(result);
    });
}

app.post('/api/users', (req, res, next) => {
   
    const encrypted = bcrypt.hashSync(req.body.password)
    let user = {
        username: req.body.username,
        email: req.body.email,
        password: encrypted,
        location: req.body.location

    };

    let count = 0;
    users.find({}).toArray((err, Users) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        for (let i = 0; i < Users.length; i++) {
            if (Users[i].username == user.username)
            count++;
            if(Users[i].email == user.email)    
            count++;

        }
        // Add user if not already signed up
        if (count == 0) {
            users.insertOne(user, (err, User) => {
                if (err) {
                    res.send(err);
                }
                let payload = {
                    subject: User._id
                };

                let token = jwt.sign(payload, SECRET_KEY);


                let toEmail = user.email;
                let subject = "Welcome to WeChat";
                let message = "Hello " + user.username + " " + "your user id is: " + user.email + " " + "and password is: " + user.password;
                mail.Mail(toEmail, subject, message);
                res.json({ User, "token": token });
            });
        }
        else {
            // Alert message logic here
            if(count !== 0)
            res.json({ user_already_signed_up: true });
            

        }
    });

});

app.post('/api/login', (req, res) => {
    let isPresent = false;
    let correctPassword = false;
    let loggedInUser;
    let token;
    users.findOne({ username: req.body.username }, function (err, data) {
        if (err) {
            console.log(err);
        } if (!data) {

            console.log("Sorry! username not found!")
            res.status(400).json("Sorry! email not found")
        } else {


            value = bcrypt.compareSync(req.body.password, data.password)
            console.log(req.body.password);
            console.log(data.password);
            if (value) {
                let payload = {
                    subject: data._id
                };
                token = jwt.sign(payload, SECRET_KEY);
                isPresent = true;
                correctPassword = true;
                loggedInUser = {
                    username: data.username,
                    email: data.email
                }
            } else {
                isPresent = true;
                console.log("invalid password");
            }
        }

        return res.send({ isPresent: isPresent, correctPassword: correctPassword, user: loggedInUser, "token": token });
    });
});

app.get('/api/users', (req, res, next) => {
    users.find({}, { username: 1, email: 1, _id: 0 }).toArray((err, users) => {
        if (err) {
            res.send(err);
        }
        res.json(users);
    });
});

app.get('/chatroom/:room', (req, res, next) => {
    let room = req.params.room;
    chatRooms.find({ name: room }).toArray((err, chatroom) => {
        if (err) {
            console.log(err);
            return false;
        }
        return res.json(chatroom[0]);
    });
});




