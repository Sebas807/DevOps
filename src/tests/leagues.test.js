const request = require("supertest");
const app = require("../index");
const db = require("../firebase-admin");

jest.mock("../firebase-admin", () => ({
  collection: jest.fn(),
}));

describe("League Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Prueba de Get
  test("GET /leagues should return a list of leagues", async () => {
    const mockSnapshot = {
      docs: [
        { id: "1", data: () => ({ name: "Premier League", country: "UK" }) },
        { id: "2", data: () => ({ name: "La Liga", country: "Spain" }) },
      ],
    };
    db.collection.mockReturnValue({
      get: jest.fn().mockResolvedValue(mockSnapshot),
    });
    const response = await request(app).get("/api/leagues");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: "1", name: "Premier League", country: "UK" },
      { id: "2", name: "La Liga", country: "Spain" },
    ]);
  });

  // Prueba de Post
  test("POST /leagues should create a league", async () => {
    db.collection.mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: "123" }),
    });
    const newLeague = { name: "Serie A", country: "Italy" };
    const response = await request(app).post("/api/leagues").send(newLeague);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: "123", name: "Serie A" });
  });

  // Prueba de Put
  test("PUT /leagues/:leagueId should update a league", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: jest.fn().mockResolvedValue(),
        id: "123",
      }),
    });
    const updatedLeague = { name: "Bundesliga", country: "Germany" };
    const response = await request(app)
      .put("/api/leagues/123")
      .send(updatedLeague);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "123", ...updatedLeague });
  });

  // Prueba de Patch
  test("PATCH /api/leagues/:leagueId should partially update a league", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: jest.fn().mockResolvedValue(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: "Serie A",
            country: "Italy",
          }),
        }),
      }),
    });
    const partialUpdate = { country: "Spain" };
    const response = await request(app)
      .patch("/api/leagues/123")
      .send(partialUpdate);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "League updated",
      leagueId: "123",
      updatedFields: partialUpdate,
      newData: {
        name: "Serie A",
        country: "Italy",
      },
    });
    expect(db.collection).toHaveBeenCalledWith("leagues");
    expect(db.collection().doc).toHaveBeenCalledWith("123");
    expect(db.collection().doc().update).toHaveBeenCalledWith(partialUpdate);
  });

  // Prueba de Delete
  test("DELETE /leagues/:leagueId should delete a league", async () => {
    const mockBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(),
    };
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ name: "Serie A" }),
        }),
        collection: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: [] }),
        }),
        delete: jest.fn().mockResolvedValue(),
      }),
    });
    db.batch = jest.fn().mockReturnValue(mockBatch);
    const response = await request(app).delete("/api/leagues/123");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "League eliminated",
      league: { id: "123", leagueName: "Serie A" },
    });
    expect(mockBatch.commit).toHaveBeenCalled();
    expect(db.collection).toHaveBeenCalledWith("leagues");
    expect(db.collection().doc).toHaveBeenCalledWith("123");
    expect(db.collection().doc().delete).toHaveBeenCalled();
  });

  // Error en el GET
  test("GET /leagues should handle errors", async () => {
    db.collection.mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error("Database error")),
    });
    const response = await request(app).get("/api/leagues");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Database error" });
  });

  // Error en el POST
  test("POST /leagues should handle errors", async () => {
    db.collection.mockReturnValue({
      add: jest.fn().mockRejectedValue(new Error("Database error")),
    });
    const newLeague = { name: "Serie A", country: "Italy" };
    const response = await request(app).post("/api/leagues").send(newLeague);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Database error" });
  });

  // Error en el PUT
  test("PUT /leagues/:leagueId should handle errors", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: jest.fn().mockRejectedValue(new Error("Database error")),
      }),
    });
    const updatedLeague = { name: "Bundesliga", country: "Germany" };
    const response = await request(app)
      .put("/api/leagues/123")
      .send(updatedLeague);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Database error" });
  });

  // Error en el PATCH
  test("PATCH /leagues/:leagueId should handle errors", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: jest.fn().mockRejectedValue(new Error("Database error")),
        get: jest.fn().mockResolvedValue({ exists: true }),
      }),
    });
    const partialUpdate = { country: "Spain" };
    const response = await request(app)
      .patch("/api/leagues/123")
      .send(partialUpdate);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Database error" });
  });

  // Error en el DELETE
  test("DELETE /leagues/:leagueId should handle errors", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest
          .fn()
          .mockResolvedValue({
            exists: true,
            data: () => ({ name: "Serie A" }),
          }),
        collection: jest.fn().mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      }),
    });
    const response = await request(app).delete("/api/leagues/123");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Database error" });
  });

  // Fallo en la B.D
  test("GET /leagues should handle database errors", async () => {
    db.collection.mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error("DB Error")),
    });
  
    const response = await request(app).get("/api/leagues");
  
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "DB Error" });
  });

  // Datos incorrectos enviados
  test("POST /leagues should handle errors", async () => {
    db.collection.mockReturnValue({
      add: jest.fn().mockRejectedValue(new Error("Failed to add league")),
    });
  
    const newLeague = { name: "Serie A" }; // Falta el país
    const response = await request(app).post("/api/leagues").send(newLeague);
  
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to add league" });
  });  

  // Liga inexistente
  test("PUT /leagues/:leagueId should handle update errors", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        update: jest.fn().mockRejectedValue(new Error("Failed to update league")),
      }),
    });
  
    const updatedLeague = { name: "Bundesliga", country: "Germany" };
    const response = await request(app)
      .put("/api/leagues/123")
      .send(updatedLeague);
  
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to update league" });
  });  

  // Liga no encontrada
  test("DELETE /leagues/:leagueId should return 404 if league not found", async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      }),
    });
  
    const response = await request(app).delete("/api/leagues/123");
  
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "League not found" });
  });  
});
