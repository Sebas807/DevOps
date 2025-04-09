const express = require("express");
const dotenv = require("dotenv");
const teamsRoutes = require("./routes/teams");
const leaguesRoutes = require("./routes/leagues");
const playersRoutes = require("./routes/players");
const microserviceRoutes = require("./routes/microservice");
const healthRoutes = require("./routes/health");

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api/v2/leagues", teamsRoutes);
app.use("/api/v2/leagues", leaguesRoutes);
app.use("/api/v2/leagues", playersRoutes);
app.use("/api/v2/microservice", microserviceRoutes);
app.use("/api/v2/health", healthRoutes);

app.get("/", (req, res) => {
  res.send("¡Bienvenido a la API Rest de fútbol!");
});

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
