const express = require("express");
const router = express.Router();
const utils = require("./utils");
const authenticateToken = utils.authenticateToken;

const helloWorld = require("./controllers/helloWorld");
router.get("/hello-world", helloWorld.GET);

const forgotPassword = require("./controllers/forgotPassword");
router.post("/forgot-password", forgotPassword.POST);

const login = require("./controllers/login");
router.post("/login", login.POST);

const logout = require("./controllers/logout");
router.delete("/logout", logout.DELETE);

module.exports = router;
