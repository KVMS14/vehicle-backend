import mongoose from "mongoose";

const PointSchema = new mongoose.Schema({
  lat: Number,
  lon: Number,
  time: Number
});

const RouteSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD (hora local GMT-5)
    required: true
  },
  startTime: Number,
  endTime: Number,
  active: Boolean,
  points: [PointSchema]
});

export default mongoose.model("Route", RouteSchema);
