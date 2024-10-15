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
   
});
});

