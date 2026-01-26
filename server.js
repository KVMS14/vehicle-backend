import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// const PORT = 3000;
const PORT = process.env.PORT || 3000;
const DATA_FILE = "./data.json";

// Importante
let activeRoute = null;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

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
app.post("/route/start", (req, res) => {
  if (activeRoute) {
    return res.status(400).json({ error: "Ya hay una ruta activa" });
  }

  activeRoute = {
    id: "route_" + Date.now(),
    active: true,
    startTime: Date.now(),
    endTime: null,
    points: []
  };

  console.log("🚗 Ruta iniciada:", activeRoute.id);
  res.json({ status: "Ruta iniciada", id: activeRoute.id });
});

// ================= STOP ROUTE =================
app.post("/route/stop", (req, res) => {
  if (!activeRoute) {
    return res.status(400).json({ error: "No hay ruta activa" });
  }

  activeRoute.active = false;
  activeRoute.endTime = Date.now();

  const routes = JSON.parse(fs.readFileSync("routes.json"));
  routes.push(activeRoute);
  fs.writeFileSync("routes.json", JSON.stringify(routes, null, 2));

  console.log("🛑 Ruta finalizada:", activeRoute.id);

  activeRoute = null;

  res.json({ status: "Ruta guardada" });
});


// ================= HTTP GPS =================
app.post("/gps", (req, res) => {
  const { lat, lon } = req.body;

  if (typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const point = {
    lat,
    lon,
    time: Date.now()
  };
  
  //NUEVO
  if (activeRoute) {
    activeRoute.points.push(point);
  }


  // Guardar historial
  const history = JSON.parse(fs.readFileSync(DATA_FILE));
  history.push(point);
  fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));

  // Emitir en tiempo real
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(point));
    }
  });

  res.json({ status: "OK" });
});

// ================= START =================
server.listen(PORT, () => {
  // console.log(`🚀 WebSocket backend activo en http://localhost:${PORT}`);
  console.log(`🚀 WebSocket backend activo en puerto ${PORT}`);
});
