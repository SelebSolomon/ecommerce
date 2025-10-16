const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    logger: true, //   detailed logs
    debug: true,
  });

  const emailOptions = {
    from: "seleb solomon <seleb@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html if i want to send back html lol
  };

  //  i can send it normal but let me catch error if there is
  try {
    await transporter.verify();
    await transporter.sendMail(emailOptions);
    console.log("email sent");
  } catch (error) {
    console.log('Sending email error',error.message);
    throw error;
  }
};

module.exports = sendEmail