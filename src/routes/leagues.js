const express = require("express");
const router = express.Router();
const db = require("../firebase-admin");

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("leagues").get();
    const leagues = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(leagues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, country } = req.body;
    const leagueRef = await db.collection("leagues").add({ name, country });
    res.status(201).json({ id: leagueRef.id, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:leagueId", async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { name, country } = req.body;
    const leagueRef = db.collection("leagues").doc(leagueId);
    await leagueRef.update({ name, country });
    res.status(200).json({ id: leagueRef.id, name, country });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:leagueId", async (req, res) => {
  try {
    const { leagueId } = req.params;
    const data = req.body;
    const leagueRef = db.collection("leagues").doc(leagueId);
    await leagueRef.update(data);
    const leagueUpdated = (await leagueRef.get()).data();
    res.status(200).json({
      message: "League updated",
      leagueId: leagueId,
      updatedFields: data,
      newData: leagueUpdated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:leagueId", async (req, res) => {
  try {
    const { leagueId } = req.params;
    const leagueRef = db.collection("leagues").doc(leagueId);
    const leagueDoc = await leagueRef.get();
    const name = leagueDoc.data().name;
    const teamsRef = leagueRef.collection("teams");
    const teamsSnapshot = await teamsRef.get();
    const batch = db.batch();
    for (const teamDoc of teamsSnapshot.docs) {
      const teamRef = teamsRef.doc(teamDoc.id);
      const playersRef = teamRef.collection("players");
      const playersSnapshot = await playersRef.get();
      playersSnapshot.forEach((playerDoc) => {
        batch.delete(playerDoc.ref); 
      });
      batch.delete(teamRef); 
    }
    await batch.commit();
    await db.collection("leagues").doc(leagueId).delete();
    res.status(200).json({
      message: "League eliminated",
      league: { id: leagueId, leagueName: name },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
