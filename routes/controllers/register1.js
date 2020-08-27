exports.POST = (req, res) => {
  const db = require("../../database");
  const utils = require("../utils");
  const sendSms = utils.sendSms;
  const sendEmail = utils.sendEmail;
  const emailSubmitted = req.body.email;
  const smsphoneSubmitted = req.body.smsphone;
  const smsphoneCountrySubmitted = req.body.smsPhoneCountry;

  if (emailSubmitted.length) {
    const validator = require("email-validator");
    const isValidEmail = validator.validate(emailSubmitted);
    if (!isValidEmail) {
      return res
        .status(400)
        .send({ msg: "invalid email format", msgType: "error" });
    }
  }

  const sqlCheckUserExistsEmail = `
    SELECT m.memberid, m.fullname, m.email, m.smsphone, m.lang, m.registrationToken, m.registrationSmsCode, mr.role
    FROM members m
    INNER JOIN members__roles mr ON m.memberid = mr.memberid
    WHERE m.email = ?
    LIMIT 1;
  `;
  const sqlCheckUserExistsSms = `
    SELECT m.memberid, m.fullname, m.email, m.smsphone, m.lang, m.registrationToken, m.registrationSmsCode, mr.role
    FROM members m
    INNER JOIN members__roles mr ON m.memberid = mr.memberid
    WHERE m.smsphone = ?
    LIMIT 1;
  `;
  const sqlCheckUserExists = (emailSubmitted.length) ? sqlCheckUserExistsEmail : sqlCheckUserExistsSms;
  const sqlParams = (emailSubmitted.length) ? [emailSubmitted] : [smsphoneSubmitted];

  db.query(
    sqlCheckUserExists,
    sqlParams,
    (error, result) => {
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
      let registrationToken = require("crypto").randomBytes(16).toString("hex");
      let registrationSmsCode = require("crypto")
        .randomBytes(3)
        .toString("hex");
      const existingRegistrationToken = result[0].registrationToken;
      const existingRegistrationSmsCode = result[0].registrationSmsCode;
      if (existingRegistrationToken.length === 32)
        registrationToken = existingRegistrationToken;
      if (existingRegistrationSmsCode.length === 6)
        registrationSmsCode = existingRegistrationSmsCode;
      const sqlAddRegistrationToken = `
        UPDATE members
        SET
          registrationToken = ?,
          registrationSmsCode = ?
        WHERE memberid = ?
      `;

      db.query(
        sqlAddRegistrationToken,
        [registrationToken, registrationSmsCode, memberid],
        async (error, result) => {
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

          // SEND REGISTRATION LINK VIA SMS
          if (smsphoneSubmitted.length && smsphoneSubmitted === smsphone) {
            const smsContent = `${registrationSmsCode.toUpperCase()} is the code for ${fullname} to register for the Health Check app.\n\n`;
            const smsResult = sendSms(smsphoneSubmitted, smsContent);
            return res.status(200).send({
              msg: "registration link sent",
              msgType: "success",
            });
          }

          // SEND REGISTRATION LINK VIA EMAIL
          const emailRecipient = `${fullname} <${email}>`;
          const emailSender = "Health Check <no-reply-hc@usd21.org>";
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

          const emailResult = sendEmail(
            emailRecipient,
            emailSender,
            emailSubject,
            emailBody
          );
          return res
            .status(200)
            .send({ msg: "registration link sent", msgType: "success" });
        }
      );
    }
  );
};
