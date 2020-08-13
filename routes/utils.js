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
