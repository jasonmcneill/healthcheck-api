exports.POST = (req, res) => {
  const validator = require("email-validator");
  const username = req.body.username;
  const isValidEmail = validator.validate(username);
  const sql = `
      SELECT fullName, email
      FROM members
      WHERE username = ?
      LIMIT 1;
    `;

  if (!username.length) {
    return res.status(400).send({ msg: "username missing", msgType: "error" });
  }

  if (!isValidEmail) {
    return res
      .status(400)
      .send({ msg: "invalid email address", msgType: "error" });
  }

  db.query(sql, [username], (err, result) => {
    if (err) {
      return res.status(503).send({
        msg: "unable to query for user",
        msgType: "error",
        error: error,
      });
    }

    if (!result.length) {
      // Returns a 200 status code even though it's actually a 400, to fool spam bots.
      return res.status(200).send({ msg: "user not found", msgType: "error" });
    }

    const fullName = result[0].fullName;
    const email = result[0].email;
    const token = require("crypto").randomBytes(16).toString("hex");
    const resetUrl =
      process.env.ENVIRONMENT === "production"
        ? `https://firstprinciples.mobi/lang/${lang}/healthcheck/#/new-password/${token}`
        : `http://localhost:3000/#/new-password/${token}`;

    const emailHTML = `
        <section id="usd21HealthCheckPasswordReset">
          <p>
            This message is for ${fullName}.  We just received your request to reset your password on the Health Check app.  To create a new password, please click on the following link:
          </p>
  
          <p>
            <strong><a href="${resetUrl}" style="text-decoration: underline">Reset My Password</a></strong>
          </p>
  
          <p>
          Note: you must click on the above link within 20 minutes of your request to reset your password.
          </p>
  
          <p>
            Sincerely,
          </p>
  
          <p>
            The Cyberministry
          </p>
        </section>
      `.trim();

    const emailSubject = "Password reset for Health Check";

    const expireDate = new Date();
    const tokenExpiry = expireDate.setDate(
      expireDate.getDate() + (1 / 24 / 60) * 20
    );

    const sql =
      "INSERT INTO users(passwordResetToken, passwordResetTokenExpiry) VALUES (?, ?);";

    db.query(sql, [token, tokenExpiry], (error, result) => {
      if (err) {
        return res.status(503).send({
          msg: "unable to store password reset token",
          msgType: "error",
          error: error,
        });
      }

      // using Twilio SendGrid's v3 Node.js Library
      // https://github.com/sendgrid/sendgrid-nodejs
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.HEALTH_CHECK_SENDGRID_API_KEY);
      const msg = {
        to: `${fullName} <${email}>`,
        from: "Health Check <jason.mcneill@grindstonewebdev.com>",
        subject: `${emailSubject}`,
        html: `${emailHTML}`,
      };
      sgMail.send(msg);
      return res.status(200).send({ msg: "e-mail sent", msgType: "info" });
    });
  });
};
