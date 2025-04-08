const mongoose = require("mongoose");

// Define the schema based on the frontend interface
const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    postedToFacebook: {
      type: Boolean,
      default: false,
    },
    postedToInstagram: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// Create the model based on the schema
const News = mongoose.model("News", newsSchema);

module.exports = News;
