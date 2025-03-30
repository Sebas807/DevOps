const request = require("supertest");
const app = require("../index");
const db = require("../firebase-admin");

jest.mock("../firebase-admin", () => ({
  collection: jest.fn(),
}));

describe("Player Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Prueba de Get
  test("GET /:leagueId/teams/:teamId/players should return a list of players", async () => {
    const mockSnapshot = {
      docs: [
        { id: "1", data: () => ({ name: "Lionel Messi", country: "Argentina" }) },
        { id: "2", data: () => ({ name: "Cristiano Ronaldo", country: "Portugal" }) },
      ],
    };
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue(mockSnapshot),
            }),
          }),
        }),
      }),
    });
    const response = await request(app).get("/api/v2/leagues/123/teams/456/players");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: "1", name: "Lionel Messi", country: "Argentina" },
      { id: "2", name: "Cristiano Ronaldo", country: "Portugal" },
    ]);
  });

  // Prueba de Post
  test("POST /:leagueId/teams/:teamId/players should create a player", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
              add: jest.fn().mockResolvedValue({ id: "789" }),
            }),
          }),
        }),
      }),
    });
    const newPlayer = { name: "Kylian Mbappé", country: "France" };
    const response = await request(app)
      .post("/api/v2/leagues/123/teams/456/players")
      .send(newPlayer);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: "789", name: newPlayer.name });
  });

  // Prueba de Put
  test("PUT /:leagueId/teams/:teamId/players/:playerId should update a player", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
              doc: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue(),
                id: "789",
              }),
            }),
          }),
        }),
      }),
    });
    const updatedPlayer = { name: "Neymar Jr.", country: "Brazil" };
    const response = await request(app)
      .put("/api/v2/leagues/123/teams/456/players/789")
      .send(updatedPlayer);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "789", ...updatedPlayer });
  });

  // Prueba de Patch
  test("PATCH /:leagueId/teams/:teamId/players/:playerId should partially update a player", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
              doc: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue(),
                get: jest.fn().mockResolvedValue({
                  exists: true,
                  data: () => ({ name: "Sadio Mané", country: "Senegal" }),
                }),
              }),
            }),
          }),
        }),
      }),
    });
    const partialUpdate = { country: "Germany" };
    const response = await request(app)
      .patch("/api/v2/leagues/123/teams/456/players/789")
      .send(partialUpdate);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Player updated",
      playerId: "789",
      updatedFields: partialUpdate,
      newData: { name: "Sadio Mané", country: "Senegal" },
    });
  });

  // Prueba de Delete
  test("DELETE /:leagueId/teams/:teamId/players/:playerId should delete a player", async () => {
    const mockPlayerDoc = {
      exists: true,
      data: jest.fn().mockReturnValue({ name: "Mohamed Salah" }),
    };
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            collection: jest.fn().mockReturnValue({
              doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockPlayerDoc),
                delete: jest.fn().mockResolvedValue(),
              }),
            }),
          }),
        }),
      }),
    });
    const response = await request(app).delete("/api/v2/leagues/123/teams/456/players/789");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Player eliminated",
      player: { id: "789", playerName: "Mohamed Salah" },
    });
  });
});
