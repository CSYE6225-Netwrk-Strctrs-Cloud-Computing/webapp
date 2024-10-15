import { expect } from 'chai';
import request from 'supertest';
import app, { sequelize, server } from './index.js';

describe('API Tests', () => {
    after(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    it('should connect to the database', async () => {
        try {
            await sequelize.authenticate();
            expect(true).to.be.true;
        } catch (error) {
            expect.fail('Database connection failed: ' + error.message);
        }
        describe('Health Check', () => {
            it('should return 200 for healthy service', async () => {
                const res = await request(app).get('/healthz');
                expect(res.status).to.equal(200);
            });
    });
    describe('User Retrieval', () => {
        it('should retrieve user information successfully', async () => {
            
            const res = await request(app)
                .get('/v1/user/self')
                .set('Authorization', `Basic ${Buffer.from('test@example.com:TestPassword1').toString('base64')}`);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('emailAddress', 'test@example.com');
        });

        it('should return 401 for unauthorized access', async () => {
            const res = await request(app).get('/v1/user/self');
            expect(res.status).to.equal(401);
        });
    });

   
});
});

