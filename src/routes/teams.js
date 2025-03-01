const express = require("express");
const router = express.Router();
const db = require("../firebase-admin");

router.get("/:leagueId/teams", async (req, res) => {
  try {
    const { leagueId } = req.params;
    const snapshot = await db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .get();
    const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:leagueId/teams", async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { name } = req.body;
    const teamRef = await db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .add({ name });
    res.status(201).json({ id: teamRef.id, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
