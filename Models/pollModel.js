const mongoose = require("mongoose");

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 300,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    options: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 100,
        },

        votes: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Active", "Closed"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Poll = mongoose.model("Poll", pollSchema);

module.exports = Poll;