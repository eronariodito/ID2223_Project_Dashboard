require("dotenv").config();

const mongoose = require("mongoose");

const express = require("express");

module.exports = (connection) => {
  const router = express.Router();

  // Define the Schema
  const inferenceSchema = new mongoose.Schema(
    {
      id: String,
      country_code: String,
      date: Date,
      data: mongoose.Schema.Types.Mixed,
    },
    { strict: false }
  ); // strict: false allows for flexible debugging

  // Create the model
  const Inference = connection.model(
    "Inference",
    inferenceSchema,
    "inferences_data"
  );

  // Getting All
  router.get("/", (req, res) => {
    res.send("Hello World");
  });

  router.get("/region", async (req, res) => {
    try {
      const { country_code } = req.query;

      // Build the aggregation pipeline based on whether countrycode is provided
      const pipeline = [];

      // Match stage - only include if countrycode is provided
      if (country_code) {
        pipeline.push({
          $match: {
            country_code: country_code.toUpperCase(),
          },
        });
      }

      // Group stage
      pipeline.push({
        $group: {
          _id: "$country_code",
          entries: {
            $push: {
              date: "$date",
              data: "$prediction",
            },
          },
          count: { $sum: 1 },
        },
      });

      // Sort by countrycode
      pipeline.push({
        $sort: { _id: 1 },
      });

      const groupedData = await Inference.aggregate(pipeline);

      res.json({
        success: true,
        data: groupedData,
        query: { country_code },
      });
    } catch (error) {
      console.error("Error fetching grouped data:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
};
