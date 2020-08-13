exports.POST = (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken)
    return res
      .status(400)
      .send({ msg: "missing refresh token", msgType: "error" });
  jwt.verify(
    refreshToken,
    process.env.HEALTH_CHECK_REFRESH_TOKEN_SECRET,
    (err1, result1) => {
      if (err1)
        return res
          .status(400)
          .send({ msg: "invalid refresh token", msgType: "error" });
      const hash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");
      const sqlQuery = `
      SELECT
        m.username AS username,
        m.usertype AS usertype,
        m.firstName AS firstName,
        m.lastName AS lastName,
        m.fullName AS fullName
      FROM members m
      INNER JOIN refreshTokens rt ON m.memberid = rt.memberid
      WHERE rt.hash = ?
      AND (
        rt.expiry > NOW()
        OR
        rt.expiry IS NULL
      )
      LIMIT 1;
    `;
      db.query(sqlQuery, [hash], (err2, refreshTokenData) => {
        if (err2)
          return res.status(400).send({
            msg: "unable to query for refresh token",
            msgType: "error",
          });
        if (!refreshTokenData.length)
          return res
            .status(404)
            .send({ msg: "invlid refresh token", msgType: "error" });
        const username = refreshTokenData[0].username;
        const usertype = refreshTokenData[0].usertype;
        const firstName = refreshTokenData[0].firstName;
        const lastName = refreshTokenData[0].lastName;
        const fullName = refreshTokenData[0].fullName;
        const newAccessToken = jwt.sign(
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
        res.json({ accessToken: newAccessToken });
      });
    }
  );
};
