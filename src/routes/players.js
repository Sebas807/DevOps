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

router.put("/:leagueId/teams/:teamId/players/:playerId", async (req, res) => {
  try {
    const { leagueId, teamId, playerId } = req.params;
    const { name, country } = req.body;
    const playerRef = db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .doc(teamId)
      .collection("players")
      .doc(playerId);
    await playerRef.update({ name, country });
    res.status(200).json({ id: playerRef.id, name, country });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:leagueId/teams/:teamId/players/:playerId", async (req, res) => {
  try {
    const { leagueId, teamId, playerId } = req.params;
    const data = req.body;
    const playerRef = db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .doc(teamId)
      .collection("players")
      .doc(playerId);
    await playerRef.update(data);
    const playerUpdated = (await playerRef.get()).data();
    res.status(200).json({
      message: "Player updated",
      playerId: playerId,
      updatedFields: data,
      newData: playerUpdated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete(
  "/:leagueId/teams/:teamId/players/:playerId",
  async (req, res) => {
    try {
      const { leagueId, teamId, playerId } = req.params;
      const playerRef = db
        .collection("leagues")
        .doc(leagueId)
        .collection("teams")
        .doc(teamId)
        .collection("players")
        .doc(playerId);
      const playerDoc = await playerRef.get();
      if (!playerDoc.exists) {
        return res.status(404).json({ message: "Player not found" });
      }
      const name = playerDoc.data().name;
      await db
        .collection("leagues")
        .doc(leagueId)
        .collection("teams")
        .doc(teamId)
        .collection("players")
        .doc(playerId)
        .delete();
      res.status(200).json({
        message: "Player eliminated",
        player: { id: playerId, playerName: name },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
