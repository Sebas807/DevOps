const request = require("supertest");
const app = require("../index");
const db = require("../firebase-admin");

// Mock del módulo de firebase-admin
jest.mock("../firebase-admin", () => ({
  collection: jest.fn(),
}));

describe("GET /api/v2/microservice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debe fallar intencionalmente si failOn=3", async () => {
    const res = await request(app).get("/api/v2/microservice?failOn=3");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Fallo intencional en el Paso 3");
  });

  it("debe responder con leagues, teams y players correctamente", async () => {
    // Mock de Firestore
    const mockPlayer = { name: "Player 1" };
    const mockTeam = { name: "Team 1" };
    const mockLeague = { name: "League 1" };

    const playersSnap = { docs: [{ id: "p1", data: () => mockPlayer }] };
    const teamsSnap = {
      docs: [
        {
          id: "t1",
          data: () => mockTeam,
          ref: { id: "t1" },
        },
      ],
    };
    const leaguesSnap = {
      docs: [
        {
          id: "l1",
          data: () => mockLeague,
          ref: { id: "l1" },
        },
      ],
    };

    // Definir mocks anidados
    db.collection.mockImplementation((col) => {
      if (col === "leagues") {
        return {
          get: () => Promise.resolve(leaguesSnap),
          doc: () => ({
            collection: (subcol) => {
              if (subcol === "teams") {
                return {
                  get: () => Promise.resolve(teamsSnap),
                  doc: () => ({
                    collection: () => ({
                      get: () => Promise.resolve(playersSnap),
                    }),
                  }),
                };
              }
              return null;
            },
          }),
        };
      }
      return null;
    });

    const res = await request(app).get("/api/v2/microservice");
    expect(res.status).toBe(200);
    expect(res.body.paso).toBe(3);
    expect(res.body.leagues).toHaveLength(1);
    expect(res.body.leagues[0].teams[0].players[0].name).toBe("Player 1");
  });
});
