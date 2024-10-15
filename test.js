import { expect } from 'chai';
import request from 'supertest';
import app, { sequelize } from './index.js';

describe('API Tests', () => {
    // Before all tests, ensure the database is connected
    before(async () => {
        try {
            await sequelize.authenticate();
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    });

    // Clean up after all tests by closing the database connection
    after(async () => {
        await sequelize.close();
    });

    // Test for database connection
    it('should connect to the database', async () => {
        try {
            await sequelize.authenticate();
            expect(true).to.be.true;
        } catch (error) {
            expect.fail('Database connection failed: ' + error.message);
        }
    });

   

    // Test for invalid user update (e.g., invalid name format)
    it('should return 400 for invalid user update', async () => {
        const authHeader = 'Basic ' + Buffer.from('newuser@example.com:Password123').toString('base64');

        const response = await request(app)
            .put('/v1/user/self')
            .set('Authorization', authHeader)
            .send({
                givenName: 'Invalid123', // Invalid given name
            });

        expect(response.status).to.equal(400);
        expect(response.body.error).to.equal('First name must only contain alphabets');
    });

    // Test for missing required fields during user creation
    it('should return 400 for missing required fields when creating user', async () => {
        const response = await request(app)
            .post('/v1/user')
            .send({
                emailAddress: 'testmissingfields@example.com',
                userPassword: 'Password123',
                givenName: 'John',
            }); // Missing surname field

        expect(response.status).to.equal(400);
        expect(response.body.error).to.equal('All fields are required');
    });

    // Test unauthorized access to user details
    it('should return 401 for unauthorized access to user self info', async () => {
        const response = await request(app).get('/v1/user/self');
        expect(response.status).to.equal(401);
    });

    // Test retrieving user details with invalid credentials
    it('should return 401 for invalid credentials during user self info retrieval', async () => {
        const authHeader = 'Basic ' + Buffer.from('invalid@example.com:InvalidPassword').toString('base64');

        const response = await request(app)
            .get('/v1/user/self')
            .set('Authorization', authHeader);

        expect(response.status).to.equal(401);
    });

    // Test updating non-existent user
    it('should return 401 for non-existent user update', async () => {
        const authHeader = 'Basic ' + Buffer.from('nonexistent@example.com:Password123').toString('base64');

        const response = await request(app)
            .put('/v1/user/self')
            .set('Authorization', authHeader)
            .send({
                givenName: 'NewName',
                surname: 'NewSurname',
            });

        expect(response.status).to.equal(401);
    });
});
