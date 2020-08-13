exports.DELETE = (req, res) => {
  const refreshToken = req.body.refreshToken;
  const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const sqlQuery = `
    DELETE FROM refreshTokens
    WHERE hash = ?
  `;
  db.query(sqlQuery, [hash], (err, result) => {
    if (err)
      return res.status(400).send({
        msg: "unable to query for refresh token to delete",
        msgType: "error",
      });
    if (result.affectedRows !== 1)
      return res
        .status(204)
        .send({ msg: "no refresh token was found to delete", msgType: "info" });
    res.status(200).send({ msg: "refresh token deleted", msgType: "info" });
  });
};
