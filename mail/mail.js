const nodemailer = require("nodemailer");


exports.Mail = function (toEmail, subject, message) {
// console.log("tomailwwwwwwwwwwww", toEmail,"sub", subject,"msg", message);

const transporter = nodemailer.createTransport({
service: 'gmail',
auth: {
user: "simarsingh.huda.sa@gmail.com",
pass: "cxAcXreFfbde"
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