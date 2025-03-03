const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: "User",
  },
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema({
  username: String,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}, "_id username");
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  const { username } = req.body;

  const newUser = new User({ username });
  const savedUser = await newUser.save();

  res.json({
    _id: savedUser._id,
    username: savedUser.username,
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = await User.findById(userId);

  const exerciseDate = date ? new Date(date) : new Date();

  const newExercise = new Exercise({
    userId: userId,
    description,
    duration: Number(duration),
    date: exerciseDate,
  });

  const savedExercise = await newExercise.save();

  res.json({
    _id: user._id,
    username: user.username,
    description: savedExercise.description,
    duration: savedExercise.duration,
    date: savedExercise.date.toDateString(),
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = await User.findById(userId);

  let query = { userId: userId };

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  let exercises = await Exercise.find(query).limit(
    limit ? Number(limit) : undefined
  );

  const log = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log: log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
