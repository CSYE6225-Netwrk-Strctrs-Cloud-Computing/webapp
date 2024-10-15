import { expect } from 'chai';
import request from 'supertest';
import app, { sequelize, server } from './index.js';

describe('API Tests', () => {
    after(async () => {
        // Close the server after tests
        await new Promise((resolve) => server.close(resolve));
    });

    it('should connect to the database', async () => {
        try {
            await sequelize.authenticate();
            expect(true).to.be.true;
        } catch (error) {
            expect.fail('Database connection failed: ' + error.message);
        }
    });

 
    
});
