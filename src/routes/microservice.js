const express = require("express");
const router = express.Router();
const db = require("../firebase-admin");

router.get("/", async (req, res) => {
  try {
    const failOn = req.query.failOn;

    if (failOn === "3") {
      throw new Error("Fallo intencional en el Paso 3");
    }

    const leaguesSnap = await db.collection("leagues").get();
    const leagues = [];

    for (const leagueDoc of leaguesSnap.docs) {
      const leagueData = leagueDoc.data();
      leagueData.id = leagueDoc.id;

      const teamsSnap = await db
        .collection("leagues")
        .doc(leagueDoc.id)
        .collection("teams")
        .get();

      const teams = [];

      for (const teamDoc of teamsSnap.docs) {
        const teamData = teamDoc.data();
        teamData.id = teamDoc.id;

        const playersSnap = await db
          .collection("leagues")
          .doc(leagueDoc.id)
          .collection("teams")
          .doc(teamDoc.id)
          .collection("players")
          .get();

        const players = playersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        teamData.players = players;
        teams.push(teamData);
      }

      leagueData.teams = teams;
      leagues.push(leagueData);
    }

    res.json({
      paso: 3,
      leagues,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
