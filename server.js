import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import cors from "cors";
import mongoose from "mongoose";
import Route from "./models/Route.js";


const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// const PORT = 3000;
const PORT = process.env.PORT || 3000;
const DATA_FILE = "./data.json";

//MONGODB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("🟢 MongoDB conectado");
  })
  .catch(err => {
    console.error("🔴 Error MongoDB:", err.message);
  });

// Importante
let activeRoute = null;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

//Nuevo agregado
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "Vehicle WebSocket Backend",
    time: new Date().toISOString()
  });
});

// ================= INIT STORAGE =================
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// ================= WEBSOCKET =================
wss.on("connection", ws => {
  console.log("🟢 Cliente WebSocket conectado");

  ws.on("close", () => {
    console.log("🔴 Cliente WebSocket desconectado");
  });
});

// ================= START ROUTE =================
//app.post("/route/start", (req, res) => {
//  if (activeRoute) {
//    return res.status(400).json({ error: "Ya hay una ruta activa" });
//  }

//  activeRoute = {
//    id: "route_" + Date.now(),
//    active: true,
//    startTime: Date.now(),
//    endTime: null,
//    points: []
//  };

//  console.log("🚗 Ruta iniciada:", activeRoute.id);
//  res.json({ status: "Ruta iniciada", id: activeRoute.id });
//});

app.post("/route/start", async (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  if (activeRoute) {
    return res.json({ message: "Ruta ya activa" });
  }

  activeRoute = new Route({
    deviceId,
    startTime: Date.now(),
    active: true,
    points: []
  });

  await activeRoute.save();

  res.json({ status: "Ruta iniciada" });
});


// ================= HTTP GPS =================
//app.post("/gps", (req, res) => {
//  const { lat, lon } = req.body;

//  if (typeof lat !== "number" || typeof lon !== "number") {
//    return res.status(400).json({ error: "Datos inválidos" });
//  }

//  const point = {
//    lat,
//    lon,
//    time: Date.now()
//  };
  
  //NUEVO
//  if (activeRoute) {
//    activeRoute.points.push(point);
//  }


  // Guardar historial
//  const history = JSON.parse(fs.readFileSync(DATA_FILE));
//  history.push(point);
//  fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));

  // Emitir en tiempo real
//  wss.clients.forEach(client => {
//    if (client.readyState === 1) {
//      client.send(JSON.stringify(point));
//    }
//  });

//  res.json({ status: "OK" });
//});

app.post("/gps", async (req, res) => {
  const { lat, lon } = req.body;

  if (typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const point = {
    lat,
    lon,
    time: Date.now()
  };

  if (activeRoute) {
    activeRoute.points.push(point);
    await activeRoute.save();
  }

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(point));
    }
  });

  res.json({ status: "OK" });
});


// ================= STOP ROUTE =================
//app.post("/route/stop", (req, res) => {
//  if (!activeRoute) {
//    return res.status(400).json({ error: "No hay ruta activa" });
//  }

//  activeRoute.active = false;
//  activeRoute.endTime = Date.now();

//  const routes = JSON.parse(fs.readFileSync("routes.json"));
//  routes.push(activeRoute);
//  fs.writeFileSync("routes.json", JSON.stringify(routes, null, 2));

//  console.log("🛑 Ruta finalizada:", activeRoute.id);

//  activeRoute = null;

//  res.json({ status: "Ruta guardada" });
//});

app.post("/route/stop", async (req, res) => {
  if (!activeRoute) {
    return res.json({ message: "No hay ruta activa" });
  }

  activeRoute.endTime = Date.now();
  activeRoute.active = false;
  await activeRoute.save();

  const finishedRoute = activeRoute;
  activeRoute = null;

  res.json({
    status: "Ruta finalizada",
    routeId: finishedRoute._id
  });
});


// ================= START =================
server.listen(PORT, () => {
  // console.log(`🚀 WebSocket backend activo en http://localhost:${PORT}`);
  console.log(`🚀 WebSocket backend activo en puerto ${PORT}`);
});
