// Use the following middleware function on all protected routes
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res
      .status(400)
      .send({ msg: "Missing access token", msgType: "error" });

  jwt.verify(
    token,
    process.env.HEALTH_CHECK_ACCESS_TOKEN_SECRET,
    (err, userdata) => {
      if (err)
        return res
          .status(403)
          .send({ msg: "invalid access token", msgType: "error" });
      req.user = userdata;
      next();
    }
  );
};

exports.sendSms = (recipient, content) => {
  const twilio = require("twilio");
  const client = new twilio(
    process.env.HEALTH_CHECK_TWILIO_ACCOUNT_SID,
    process.env.HEALTH_CHECK_TWILIO_AUTH_TOKEN
  );
  let sender = "+12058518089";
  return new Promise((resolve, reject) => {
    client.messages
      .create({
        from: sender,
        to: recipient,
        body: content,
      })
      .then((message) => {
        console.log(require("util").inspect(message, true, 7, true));
        resolve(message);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

exports.sendEmail = (recipient, sender, subject, body) => {
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.HEALTH_CHECK_SENDGRID_API_KEY);
  const msg = {
    to: recipient,
    from: sender,
    subject: subject,
    html: body,
  };
  return new Promise((resolve, reject) => {
    resolve(sgMail.send(msg));
  }).catch((error) => {
    reject(error);
  });
};
