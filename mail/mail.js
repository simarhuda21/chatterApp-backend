const nodemailer = require("nodemailer");
require('dotenv').config();

exports.Mail = function (toEmail, subject, message) {
// console.log("tomailwwwwwwwwwwww", toEmail,"sub", subject,"msg", message);

const transporter = nodemailer.createTransport({
service: 'gmail',
auth: {
user: process.env.EMAIL,
pass: process.env.EMAIL_PASSWORD
}
});

var mailOptions = {
from: "simarsingh.huda.sa@gmail.com",
to: toEmail,
subject: subject,
text: message
};


transporter.sendMail(mailOptions, function (error, info) {
if (error) {
console.log(error);
} else {
console.log('Email sent: ' + info.response);
}
});

}