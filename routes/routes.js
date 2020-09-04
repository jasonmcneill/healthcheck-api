const express = require("express");
const router = express.Router();
const utils = require("./utils");
const authenticateToken = utils.authenticateToken;

router.post("/countries", (req, res) => {
  const lang = req.body.lang || "en";
  const countryData = require(`./controllers/world-countries/data/${lang}/countries.json`);
  res.status(200).send({ lang: lang, countries: countryData });
});

const helloWorld = require("./controllers/helloWorld");
router.get("/hello-world", helloWorld.GET);

const forgotPassword = require("./controllers/forgotPassword");
router.post("/forgot-password", forgotPassword.POST);

const login = require("./controllers/login");
router.post("/login", login.POST);

const logout = require("./controllers/logout");
router.delete("/logout", logout.DELETE);

const register1 = require("./controllers/register1");
router.post("/register1", register1.POST);

const smsConfirm = require("./controllers/smsConfirm");
router.post("/smsConfirm", smsConfirm.POST);

module.exports = router;
