const express = require("express");
const dotenv = require("dotenv");
const teamsRoutes = require("./routes/teams");
const leaguesRoutes = require("./routes/leagues");
const playersRoutes = require("./routes/players");

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/leagues", teamsRoutes);
app.use("/api/leagues", leaguesRoutes);
app.use("/api/leagues", playersRoutes);

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
