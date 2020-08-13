exports.POST = (req, res) => {
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const validator = require("email-validator");
  const username = req.body.username;
  const password = req.body.password;
  const isValidEmail = validator.validate(username);
  if (!isValidEmail) {
    return res
      .status(400)
      .send({ msg: "invalid email format", msgType: "error" });
  }
  const sqlQuery = `
    SELECT
      memberid,
      username,
      password,
      usertype,
      firstName,
      lastName,
      fullName
    FROM members
    WHERE username = ?
    LIMIT 1;
  `;
  db.query(sqlQuery, [username], (err1, result1) => {
    if (err1)
      return res
        .status(400)
        .send({ msg: "unable to query for user", msgType: "error" });
    if (!result1.length)
      return res.status(404).send({ msg: "user not found", msgType: "error" });
    const memberid = result1[0].memberid;
    const username = result1[0].username;
    const usertype = result1[0].usertype;
    const firstName = result1[0].firstName;
    const lastName = result1[0].lastName;
    const fullName = result1[0].fullName;
    const passwordMeta = JSON.parse(result1[0].password);
    const hashStored = passwordMeta.hash;
    const salt = passwordMeta.salt;
    const iterations = passwordMeta.iterations;
    const keylen = passwordMeta.keylen;
    const digest = passwordMeta.digest;
    crypto.pbkdf2(
      password.trim(),
      salt,
      parseInt(iterations),
      parseInt(keylen),
      digest,
      (err2, derivedKey) => {
        if (err2)
          return res
            .status(400)
            .send({ msg: "error validating password", msgType: "error" });
        const hashSubmitted = derivedKey.toString("hex");
        const isAuthentic = hashSubmitted === hashStored ? true : false;
        if (!isAuthentic)
          return res
            .status(400)
            .send({ msg: "password is incorrect", msgType: "error" });
        // TODO:  If user's "usertype" ever changes (e.g. from Bible Talk Leader to House Church Leader), their refresh token must immediately be deleted from the database so that they are forced to login again, and get an updated usertype in their accessToken.
        const accessToken = jwt.sign(
          {
            username: username,
            usertype: usertype,
            firstName: firstName,
            lastName: lastName,
            fullName: fullName,
          },
          process.env.HEALTH_CHECK_ACCESS_TOKEN_SECRET,
          {
            algorithm: "HS256",
            expiresIn: "30m",
          }
        );
        const expiresInDays = 180;
        const refreshTokenExpiry = addDays(new Date(), expiresInDays);
        const refreshToken = jwt.sign(
          {
            username: username,
          },
          process.env.HEALTH_CHECK_REFRESH_TOKEN_SECRET,
          {
            algorithm: "HS256",
            expiresIn: `${expiresInDays}d`,
          }
        );
        const hash = crypto
          .createHash("sha256")
          .update(refreshToken)
          .digest("hex");
        const sqlQuery = `
        REPLACE INTO refreshTokens
        SET hash = ?,
        token = ?,
        userid = ?,
        expiry = ?
        ;
      `;
        db.query(
          sqlQuery,
          [hash, refreshToken, memberid, refreshTokenExpiry],
          (err3, result3) => {
            if (err3 || result3.affectedRows !== 1) {
              return res
                .status(400)
                .send({ msg: "error storing refresh token", msgType: "error" });
            }
            res.send({
              msg: "login successful",
              msgType: "info",
              accessToken: accessToken,
              refreshToken: refreshToken,
            });
          }
        );
      }
    );
  });
};
