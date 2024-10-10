const { app } = require('./index');  
const request = require('supertest');

describe("GET /healthz", () => {
  it("should return 200 when the application is healthy", async () => {
    await request(app)
      .get("/healthz")
      .set("Accept", "application/json")
      .expect(200);
  });

  it("should return 405 for non-GET requests", async () => {
    await request(app)
      .post("/healthz")  // Testing a non-GET method (POST)
      .expect(405);
  });
});
