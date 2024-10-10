const supertest = require('supertest');
const { app, sequelize } = require('./index');


jest.mock('./index', () => {
    const originalModule = jest.requireActual('./index');
    
    const mockSequelize = {
        ...originalModule.sequelize,
        sync: jest.fn().mockResolvedValue(true),
        authenticate: jest.fn().mockResolvedValue(true),
        define: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
                id: 1,
                email: 'test@example.com',
                first_name: 'Test',
                last_name: 'User',
            }),
           
        }),
    };

    return {
        ...originalModule,
        sequelize: mockSequelize,
    };
});

describe("GET /healthz", () => {
    it("returns 200 on hitting with HTTP GET method", async () => {
        await supertest(app)
            .get("/healthz") 
            .set("Accept", "application/json")
            .expect(200);
    });

    it("returns 405 Method Not Allowed for POST method", async () => {
        await supertest(app)
            .post("/healthz") 
            .set("Accept", "application/json")
            .expect(405); 
    });
});
