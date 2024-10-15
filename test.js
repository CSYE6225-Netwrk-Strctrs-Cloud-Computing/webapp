const request = require('supertest');
const { app, sequelize, User } = require('./index'); 
const bcrypt = require('bcrypt');

describe('checking User Registration here:', () => {
    const userData = {
        email: 'tanujkodasdfgli0dsfg40yht9@gmail.com',
        password: 'kodali@1972',
        first_name: 'Tanuj',
        last_name: 'kodali'
    };

    it('POST /v1/users should create a new user and return 201', async () => {
        const response = await request(app).post('/v1/users').send(userData);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(userData.email);
    });

   
});

