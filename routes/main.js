const express = require('express');
const router = express.Router();
var multer = require('multer');
const jwt = require('jsonwebtoken');
const mail = require("../mail/mail");
let messages = [];
const SECRET_KEY = process.env.SECRET_KEY;

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now())
    }
});
var upload = multer({storage: storage});
let users;
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

//Image send ***********************
        socket.on('image', (data) => {
            io.in(data.room).emit('new Image', { user: data.user, image: data.image,  });
            chatRooms.updateOne({ name: data.room }, { $push: { imagePath: { user: data.user, image: data.image  } } }, (err, res) => {
                if (err) {
                    console.log(err);
                    return false;
                }
                console.log("Document updated");
            });
        });

        socket.on('typing', (data) => {
            socket.broadcast.in(data.room).emit('typing', { data: data, isTyping: true });
        });
    });
});

router.get('/', (req, res, next) => {
    res.send('Welcome to the express server...');
});

router.post('/api/fileUpload', upload.single('photo'), (req, res, next) => {
    MongoClient.connect('mongodb://localhost:27017/WeChat', (err, db) => {
        assert.equal(null, err);
        insertDocuments(db, './uploads/' + req.file.filename, () => {
            db.close();
            res.json({ 'message': 'File uploaded successfully' });
        });
    });
});

var insertDocuments = function (db, filePath, callback) {
    console.log(filePath);
    chatRooms.insertOne({ 'imagePath': filePath, messages: [] }, (err, result) => {
        assert.equal(err, null);
        callback(result);
    });
}

router.post('/api/users', (req, res, next) => {
    let user = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,

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
                console.log("tokennnnnnnnn", token);

                let toEmail = user.email;
                let subject = "Welcome to WeChat";
                let message = "Hello " + user.username + " " + "your user id is: " + user.email + " " + "and password is: " + user.password;
                mail.Mail(toEmail, subject, message);
                res.json({ User, "token": token });
            });
        }
        else {
            // Alert message logic here
            res.json({ user_already_signed_up: true });
        }
    });

});

router.post('/api/login', (req, res) => {
    let isPresent = false;
    let correctPassword = false;
    let loggedInUser;
    let token;
    users.find({}).toArray((err, users) => {
        if (err) return res.send(err);
        users.forEach((user) => {
            if ((user.username == req.body.username)) {
                if (user.password == req.body.password) {
                    let payload = {
                        subject: users._id
                    };
                    token = jwt.sign(payload, SECRET_KEY);
                    console.log("tokennnnnnnnn", token);
                    isPresent = true;
                    correctPassword = true;
                    loggedInUser = {
                        username: user.username,
                        email: user.email
                    }
                } else {
                    isPresent = true;
                }
            }
        });
        return res.send({ isPresent: isPresent, correctPassword: correctPassword, user: loggedInUser, "token": token });
    });
});

router.get('/api/users', (req, res, next) => {
    users.find({}, { username: 1, email: 1, _id: 0 }).toArray((err, users) => {
        if (err) {
            res.send(err);
        }
        res.json(users);
    });
});

router.get('/chatroom/:room', (req, res, next) => {
    let room = req.params.room;
    chatRooms.find({ name: room }).toArray((err, chatroom) => {
        if (err) {
            console.log(err);
            return false;
        }
        return res.json(chatroom[0])
    });
});
module.exports=router;