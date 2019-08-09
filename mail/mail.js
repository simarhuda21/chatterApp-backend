const nodemailer = require("nodemailer");
require('dotenv').config();

exports.Mail = function (toEmail, subject, message) {
// console.log("tomailwwwwwwwwwwww", toEmail,"sub", subject,"msg", message);

const transporter = nodemailer.createTransport({
host: process.env.HOST,
port: process.env.PORT_NUMBER,
auth: {
user: process.env.SMTP_USERNAME,
pass: process.env.SMTP_PASSWORD
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