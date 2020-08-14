require("dotenv").config();
const express = require("express");
const app = express();
const routes = require("./routes/routes");

// cors
const cors = require("cors");
app.use(cors());

// body parser
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use("/", routes);

// listen
const port = 4000;
app.listen(port, () => console.log(`Node Express started on port ${port}`));
