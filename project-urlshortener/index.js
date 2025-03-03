require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const dns = require("dns");

const app = express();

mongoose.connect(process.env.MONGO_URI);

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

urlSchema.plugin(AutoIncrement, { inc_field: "short_url" });
const Url = mongoose.model("Url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;
  const hostname = url
    .match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/gim)[0]
    .replace(/^https?:\/\//i, "");

  dns.lookup(hostname, (err) => {
    if (err) {
      res.json({ error: "invalid url" });
    } else {
      const newUrl = new Url({
        original_url: url,
      });

      newUrl
        .save()
        .then((savedUrl) => {
          res.json({
            original_url: savedUrl.original_url,
            short_url: savedUrl.short_url,
          });
        })
        .catch((err) => {
          console.error(err);
        });
    }
  });
});

app.get("/api/shorturl/:shortUrl", (req, res) => {
  const shortUrl = req.params.shortUrl;

  Url.findOne({ short_url: shortUrl })
    .then((url) => {
      res.redirect(url.original_url);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
