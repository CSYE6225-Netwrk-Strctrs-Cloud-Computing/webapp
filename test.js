const app = require("./index").app; 
const request = require("supertest");

describe("GET /healthz", () => {
  it("returns 200 on hitting with HTTP GET method", async () => {
    await request(app)
      .get("/healthz") 
      .set("Accept", "application/json")
      .expect(200);
  });

  it("returns 405 Method Not Allowed for POST method", async () => {
    await request(app)
      .post("/healthz") 
      .set("Accept", "application/json")
      .expect(405); 
  });
});
