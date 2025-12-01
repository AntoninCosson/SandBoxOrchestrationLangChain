const mongoose = require("mongoose");

const top3Schema = mongoose.Schema({
  scores: [
    {
      username: String,
      score: Number
    }
  ]
});

const Top3 = mongoose.model("Top3", top3Schema);

module.exports = Top3;
