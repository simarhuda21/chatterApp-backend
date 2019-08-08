const nodemailer = require("nodemailer");
require('dotenv').config();

exports.Mail = function (toEmail, subject, message) {
// console.log("tomailwwwwwwwwwwww", toEmail,"sub", subject,"msg", message);

const transporter = nodemailer.createTransport({
service: 'ses',
auth: {
server_name: process.env.SERVER_NAME,
port_number: process.env.PORT_NUMBER,
aws_access_key: process.env.AWSAccessKeyId,
aws_secret_key: process.env.AWSSecretKey


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