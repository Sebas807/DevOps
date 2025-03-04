const request = require("supertest");
const app = require("../index");
const db = require("../firebase-admin");

jest.mock("../firebase-admin", () => ({
  collection: jest.fn(),
}));

describe("Team Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Prueba de Get
  test("GET /:leagueId/teams should return a list of teams", async () => {
    const mockSnapshot = {
      docs: [
        {
          id: "1",
          data: () => ({ name: "Manchester United", stadium: "Old Trafford" }),
        },
        {
          id: "2",
          data: () => ({ name: "Real Madrid", stadium: "Santiago Bernabéu" }),
        },
      ],
    };
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockSnapshot),
        }),
      }),
    });
    const response = await request(app).get("/api/leagues/123/teams");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: "1", name: "Manchester United", stadium: "Old Trafford" },
      { id: "2", name: "Real Madrid", stadium: "Santiago Bernabéu" },
    ]);
  });

  // Prueba de Post
  test("POST /:leagueId/teams should create a team", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          add: jest.fn().mockResolvedValue({ id: "456" }),
        }),
      }),
    });
    const newTeam = { name: "Juventus", stadium: "Allianz Stadium" };
    const response = await request(app)
      .post("/api/leagues/123/teams")
      .send(newTeam);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: "456", ...newTeam });
  });

  // Prueba de Put
  test("PUT /:leagueId/teams/:teamId should update a team", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            update: jest.fn().mockResolvedValue(),
            id: "456",
          }),
        }),
      }),
    });
    const updatedTeam = { name: "AC Milan", stadium: "San Siro" };
    const response = await request(app)
      .put("/api/leagues/123/teams/456")
      .send(updatedTeam);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "456", ...updatedTeam });
  });

  // Prueba de Patch
  test("PATCH /:leagueId/teams/:teamId should partially update a team", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            update: jest.fn().mockResolvedValue(),
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ name: "Juventus", stadium: "Allianz Stadium" }),
            }),
          }),
        }),
      }),
    });
    const partialUpdate = { stadium: "Juventus Stadium" };
    const response = await request(app)
      .patch("/api/leagues/123/teams/456")
      .send(partialUpdate);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Team updated",
      teamId: "456",
      updatedFields: partialUpdate,
      newData: { name: "Juventus", stadium: "Allianz Stadium" },
    });
  });

  // Prueba de Delete
  test("DELETE /:leagueId/teams/:teamId should delete a team", async () => {
    const mockBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(),
    };
    const mockPlayersSnapshot = {
      forEach: jest.fn((callback) => {
        callback({ ref: "playerRef1" });
      }),
    };
    const mockPlayersCollection = {
      get: jest.fn().mockResolvedValue(mockPlayersSnapshot),
    };
    const mockTeamDoc = {
      exists: true,
      data: jest.fn().mockReturnValue({ name: "Juventus" }),
    };
    const mockTeamsCollection = {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockTeamDoc),
        collection: jest.fn().mockReturnValue(mockPlayersCollection),
        delete: jest.fn().mockResolvedValue(),
      }),
    };
    const mockLeaguesCollection = {
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockTeamsCollection),
      }),
    };
    db.collection.mockImplementation((collectionName) => {
      if (collectionName === "leagues") return mockLeaguesCollection;
      throw new Error("Unexpected collection");
    });
    db.batch = jest.fn().mockReturnValue(mockBatch);
    const response = await request(app).delete("/api/leagues/123/teams/456");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Team eliminated",
      team: { id: "456", teamName: "Juventus" },
    });
    expect(db.collection).toHaveBeenCalledWith("leagues");
    expect(mockLeaguesCollection.doc).toHaveBeenCalledWith("123");
    expect(mockLeaguesCollection.doc().collection).toHaveBeenCalledWith(
      "teams"
    );
    expect(mockTeamsCollection.doc).toHaveBeenCalledWith("456");
    expect(mockTeamsCollection.doc().get).toHaveBeenCalled();
    expect(mockTeamsCollection.doc().collection).toHaveBeenCalledWith(
      "players"
    );
    expect(mockPlayersCollection.get).toHaveBeenCalled();
    expect(mockBatch.delete).toHaveBeenCalledWith("playerRef1");
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});
