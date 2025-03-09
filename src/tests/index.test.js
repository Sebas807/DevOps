const request = require("supertest");
const app = require("../index");

describe("Index.js routes", () => {

  // Probando rutas de equipos
  it("should load teams routes", async () => {
    const response = await request(app).get("/api/leagues/:leagueId/teams");
    expect(response.status).not.toBe(404); 
  });

  // Probando ruta de ligas
  it("should load leagues routes", async () => {
    const response = await request(app).get("/api/leagues");
    expect(response.status).not.toBe(404);
  });

  // Probando ruta de jugadores
  it("should load players routes", async () => {
    const response = await request(app).get("/api/leagues/:leagueId/teams/:teamId/players");
    expect(response.status).not.toBe(404);
  });
});
