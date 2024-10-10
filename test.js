const request = require('supertest');
const { app, User } = require('./index'); 

describe('User API', () => {
    const userData = {
        email: 'testuser@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
    };

    let server;

    beforeAll(async () => {
        server = app.listen(8081, () => {
            console.log('Test server running on http://localhost:8081');
        });
        await User.sync({ force: true }); 
    });

    it('POST /v1/users should create a new user and return 201', async () => {
        const response = await request(server).post('/v1/users').send(userData);
        console.log(response.body); 
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(userData.email);
    });

    it('POST /v1/users should return 400 if email already exists', async () => {
        await request(server).post('/v1/users').send(userData); 
        const response = await request(server).post('/v1/users').send(userData);
        console.log(response.body); 
        expect(response.status).toBe(400);
        expect(response.text).toBe('User already exists with this email.'); 
    });

    afterAll(async () => {
        await server.close(); 
        await User.sequelize.close(); 
    });
});
