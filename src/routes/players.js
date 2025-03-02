const express = require("express");
const router = express.Router();
const db = require("../firebase-admin");

router.get("/:leagueId/teams/:teamId/players", async (req, res) => {
  try {
    const { leagueId, teamId } = req.params;
    const snapshot = await db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .doc(teamId)
      .collection("players")
      .get();
    const players = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:leagueId/teams/:teamId/players", async (req, res) => {
  try {
    const { leagueId, teamId } = req.params;
    const { name, country } = req.body;
    const playerRef = await db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .doc(teamId)
      .collection("players")
      .add({ name, country });
    res.status(201).json({ id: playerRef.id, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
