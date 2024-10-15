import 'dotenv/config';
import { expect } from 'chai';
import request from 'supertest';
import app from './index.js'; // Ensure this path is correct

describe('API Tests', () => {
    before(async () => {
        // Optionally, you can initialize your database connection and any test data here.
        await app.get('/healthz'); // To ensure the server is running before tests
    });

    it('should return 200 OK for health check', (done) => {
        request(app)
            .get('/healthz')
            .end((err, res) => {
                expect(res.status).to.equal(200);
                done();
            });
    })
});
