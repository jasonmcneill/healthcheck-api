exports.POST = (req, res) => {
  const db = require("../../database");
  const email = req.body.username;
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
    SELECT memberid, email, smsphone
    FROM members
    WHERE email = ?
    OR smsphone = ?
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
        .send({ msg: "member not found", msgType: "error" });
    }
    // TODO:  Send registration link either by SMS or by e-mail
    return res.status(200).send({
      msg: "registration link sent",
      msgType: "success",
      member: result[0],
    });
  });
};
