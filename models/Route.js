import mongoose from "mongoose";

const PointSchema = new mongoose.Schema({
  lat: Number,
  lon: Number,
  timestamp: Number
});

const RouteSchema = new mongoose.Schema({
  deviceId: String,
  active: Boolean,
  startTime: Number,
  endTime: Number,
  points: [PointSchema]
});

export default mongoose.model("Route", RouteSchema);
