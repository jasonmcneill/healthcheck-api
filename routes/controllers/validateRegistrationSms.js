import db from "../../database";

exports.POST = (req, res) => {
  const smsPhone = req.body.smsPhone + "" || "";
  const smsCode = req.body.smsCode + "" || "";

  if (smsPhone.trim().length === 0) {
    return res
      .status(400)
      .send({ msg: "smsphone is required", msgType: "error" });
  }

  if (smsCode.trim().length !== 6) {
    return res
      .status(400)
      .send({ msg: "sms code must be 6-digits long", msgType: "error" });
  }

  const code = smsCode.trim() || "";
  const validNumerals = /[0-9]/g;
  const isNumeric = code.match(validNumerals);
  if (!isNumeric) {
    return res
      .status(400)
      .send({ msg: "sms code must be numeric", msgType: "error" });
  }

  const sqlQueryForMember = `
    SELECT
      memberid
    FROM
      members
    WHERE
      smsphone = ?
    LIMIT 1
    ;
  `;
  db.query(sqlQueryForMember, [smsPhone, smsCode], (error1, result1) => {
    if (error1) {
      return res
        .status(500)
        .send({ msg: "unable to query for member", msgType: "error" });
    }

    if (!result1.length) {
      return res
        .status(404)
        .send({ msg: "sms phone not found", msgType: "error" });
    }

    const memberid = result1[0].memberid;

    const sqlQueryForCode = `
      SELECT
        memberid,
        fullname,
        firstname,
        lastname,
        lang,
        email,
        smsphone
      FROM
        members
      WHERE
        memberid = ?
    `;
    db.query(sqlQueryForCode, [memberid], (error2, result2) => {
      if (error2) {
        return res
          .status(500)
          .send({ msg: "unable to query for sms code", msgType: "error" });
      }

      if (!result2.length) {
        return res
          .status(404)
          .send({ msg: "sms code not found", msgType: "error" });
      }

      return res.status(200).send({
        msg: "sms code is a match",
        msgType: "success",
        memberData: result2[0],
      });
    });
  });
};
