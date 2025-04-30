const dotenv = require("dotenv");
const { ServiceBusClient } = require("@azure/service-bus");
const axios = require("axios");
const db = require("./firebase-admin");

dotenv.config();

// Conexión procesados 1-3
const connectionStr = process.env.CONNECTION_STR;
const topicName = process.env.TOPIC_NAME;
const subscriptionName = process.env.SUBSCRIPTION_NAME;
const postUrl = process.env.POST_URL;
const sbClient = new ServiceBusClient(connectionStr);
const receiver = sbClient.createReceiver(topicName, subscriptionName);

// Conexión reprocesados 1-3
const postUrl_rep = process.env.POST_URL_REP;

const fetchFullData = async () => {
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

  return leagues;
};

const start = async () => {
  console.log(`Escuchando mensajes en '${subscriptionName}'...`);

  receiver.subscribe({
    async processMessage(msg) {
      console.log("Mensaje recibido:", msg.body);

      const message = msg.body;

      try {
        if (message.failOn === "microservice3") {
          message.error = "Fallo intencional en microservicio 3";
          console.log(
            "Fallo intencional detectado, reenviando a cola de reprocesados 1-3"
          );

          const enrichedErrorMsg = {
            message: JSON.stringify(message),
          };

          const errorRes = await axios.post(postUrl_rep, enrichedErrorMsg, {
            headers: {
              "Content-Type": "application/json",
              "X-Source": "microservice3",
              "X-Destination": "queue-reprocessed",
            },
          });
          
          console.log("Mensaje con error enviado a cola de reprocesados con éxito: ", errorRes.status);

          return;
        }
        const leagues = await fetchFullData();

        message.sendTo = "coordinator";

        message.data = {
          step3: {
            timestamp: new Date().toISOString(),
            leagues,
          },
        };

        const enrichedMsg = {
          message: JSON.stringify(message),
        };

        const res = await axios.post(postUrl, enrichedMsg, {
          headers: {
            "Content-Type": "application/json",
            "X-Source": "microservice3",
            "X-Destination": "queue-ms",
          },
        });

        console.log("Mensaje enriquecido y reenviado con éxito:", res.status);
      } catch (err) {
        console.error("Error al procesar o reenviar el mensaje:", err.message);
      }
    },

    async processError(err) {
      console.error("Error en el worker:", err);
    },
  });
};

start().catch(console.error);
