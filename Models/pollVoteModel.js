const mongoose = require("mongoose");

const pollVoteSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
    },

    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },

    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One resident can vote only once in each poll
pollVoteSchema.index(
  { poll: 1, resident: 1 },
  { unique: true }
);

const PollVote = mongoose.model(
  "PollVote",
  pollVoteSchema
);

module.exports = PollVote;