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
    const { name, stadium } = req.body;
    const teamRef = await db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .add({ name, stadium });
    res.status(201).json({ id: teamRef.id, name, stadium });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:leagueId/teams/:teamId", async (req, res) => {
  try {
    const { leagueId, teamId } = req.params;
    const { name, stadium } = req.body;
    const teamRef = db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .doc(teamId);
    await teamRef.update({ name, stadium });
    res.status(200).json({ id: teamRef.id, name, stadium });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:leagueId/teams/:teamId", async (req, res) => {
  try {
    const { leagueId, teamId } = req.params;
    const data = req.body;
    const teamRef = db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .doc(teamId);
    await teamRef.update(data);
    const teamUpdated = (await teamRef.get()).data();
    res.status(200).json({
      message: "Team updated",
      teamId: teamId,
      updatedFields: data,
      newData: teamUpdated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:leagueId/teams/:teamId", async (req, res) => {
  try {
    const { leagueId, teamId } = req.params;
    const teamRef = db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .doc(teamId);
    const teamDoc = await teamRef.get();
    if (!teamDoc.exists) {
      return res.status(404).json({ message: "Team not found" });
    }
    const name = teamDoc.data().name;
    const playersRef = teamRef.collection("players");
    const playersSnapshot = await playersRef.get();
    const batch = db.batch();
    playersSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    await db
      .collection("leagues")
      .doc(leagueId)
      .collection("teams")
      .doc(teamId)
      .delete();
    res.status(200).json({
      message: "Team eliminated",
      team: { id: teamId, teamName: name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
