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

const register1 = require("./controllers/register1");
router.post("/register1", register1.POST);

module.exports = router;
