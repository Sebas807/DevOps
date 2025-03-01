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

module.exports = router;
