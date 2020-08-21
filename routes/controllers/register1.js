exports.POST = (req, res) => {
  const db = require("../../database");
  const email = req.body.email;
  const smsphone = req.body.smsphone;

  if (email.length) {
    const validator = require("email-validator");
    const isValidEmail = validator.validate(email);
    if (!isValidEmail) {
      return res
        .status(400)
        .send({ msg: "invalid email format", msgType: "error" });
    }
  }

  const sqlCheckUserExists = `
    SELECT m.memberid, m.fullname, m.email, m.smsphone, m.lang, m.registrationToken, mr.role
    FROM members m
    INNER JOIN members__roles mr ON m.memberid = mr.memberid
    WHERE m.email = ?
    OR m.smsphone = ?
    LIMIT 1;
  `;
  db.query(sqlCheckUserExists, [email, smsphone], (error, result) => {
    if (error) {
      return res.status(400).send({
        msg: "unable to query for member",
        msgType: "error",
        error: error,
      });
    }
    if (!result.length) {
      return res
        .status(404)
        .send({ msg: "member not found", msgType: "error", result: result });
    }
    const fullname = result[0].fullname;
    const email = result[0].email;
    const smsphone = result[0].smsphone;
    const lang = result[0].lang;
    const role = result[0].role;
    const memberid = result[0].memberid;
    let registratonToken = require("crypto").randomBytes(16).toString("hex");
    const existingRegistrationToken = result[0].registrationToken;
    if (existingRegistrationToken.length === 32)
      registratonToken = existingRegistrationToken;
    const sqlAddRegistrationToken = `
        UPDATE members
        SET registrationToken = ?
        WHERE memberid = ?
      `;

    db.query(
      sqlAddRegistrationToken,
      [registrationToken, memberid],
      (error, result) => {
        if (error) {
          return res.status(400).send({
            msg: "unable to store registration token",
            msgType: "error",
            error: error,
          });
        }
        const registrationUrl =
          process.env.ENVIRONMENT === "production"
            ? `https://firstprinciples.mobi/lang/${lang}/healthcheck/#/register/${registrationToken}`
            : `http://localhost:3000/#/register/${registrationToken}`;

        const emailSubject = "Complete your registration for Health Check";

        const emailBody = `
            <section id="usd21HealthCheckRegistration">
              <p>
                This message is for ${fullname}.  Please complete your registration for the Health Check app by clicking on the link below:
              </p>
  
              <p>
                <strong><a href="${registrationUrl}">Register for Health Check</a></strong>
              </p>
  
              <p>
                Sincerely,
              </p>
  
              <p>
                The Cyberministry
              </p>
            </section>
          `.trim();

        const sgMail = require("@sendgrid/mail");
        sgMail.setApiKey(process.env.HEALTH_CHECK_SENDGRID_API_KEY);
        const msg = {
          to: `${fullname} <${email}>`,
          from: "Health Check <no-reply-hc@usd21.org>",
          subject: `${emailSubject}`,
          html: `${emailBody}`,
        };
        sgMail.send(msg);
        return res
          .status(200)
          .send({ msg: "registration link sent", msgType: "success" });
      }
    );
  });
};
