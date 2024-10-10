const request = require('supertest');
const { app } = require('./index'); 


jest.mock('./index', () => {
    const originalModule = jest.requireActual('./index');
    return {
        ...originalModule,
        CheckDatabaseConnection: jest.fn(), 
        CheckDownstreamAPI: jest.fn(), 
    };
});

const { CheckDatabaseConnection, CheckDownstreamAPI } = require('./index'); 

describe('Health Check API', () => {
    beforeEach(() => {
        jest.clearAllMocks(); 
    });

    it('should return 200 OK for a successful health check', async () => {
        
        CheckDatabaseConnection.mockResolvedValue(true); 
        CheckDownstreamAPI.mockResolvedValue(true); 

        const response = await request(app).get('/healthz');

        expect(response.status).toBe(200);
        expect(response.headers['cache-control']).toBe('no-cache'); 
    });
});
