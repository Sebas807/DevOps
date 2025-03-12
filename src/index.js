const express = require("express");
const dotenv = require("dotenv");
const teamsRoutes = require("./routes/teams");
const leaguesRoutes = require("./routes/leagues");
const playersRoutes = require("./routes/players");

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api/leagues", teamsRoutes);
app.use("/api/leagues", leaguesRoutes);
app.use("/api/leagues", playersRoutes);

app.get("/", (req, res) => {
  res.send("¡Bienvenido a la API de fútbol!");
});

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
