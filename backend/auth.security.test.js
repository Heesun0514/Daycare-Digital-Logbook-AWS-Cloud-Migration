const jwt = require('jsonwebtoken');
const request = require('supertest');

const ORIGINAL_ENV = process.env;

function loadApp() {
    jest.resetModules();
    return require('./server').app;
}

describe('Authentication hardening', () => {
    beforeEach(() => {
        process.env = {
            ...ORIGINAL_ENV,
            NODE_ENV: 'test',
            DB_HOST: 'localhost',
            DB_USER: 'testuser',
            DB_PASSWORD: 'testpass',
            DB_NAME: 'daycare_test'
        };

        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'info').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = ORIGINAL_ENV;
        jest.restoreAllMocks();
    });

    test('login requires email and password', async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.AUTH_USERS_JSON = JSON.stringify([
            { email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' }
        ]);

        const app = loadApp();
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@test.com', role: 'Teacher' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Email and password are required');
    });

    test('login rejects invalid credentials instead of trusting the requested role', async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.AUTH_USERS_JSON = JSON.stringify([
            { email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' }
        ]);

        const app = loadApp();
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@test.com', password: 'wrong-pass', role: 'Director' });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid email or password');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"event":"login.failed"'));
    });

    test('login signs tokens with the configured account role and logs successful authentication', async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.AUTH_USERS_JSON = JSON.stringify([
            { email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' }
        ]);

        const app = loadApp();
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' });

        expect(response.status).toBe(200);
        expect(response.body.role).toBe('Teacher');
        expect(jwt.verify(response.body.token, process.env.JWT_SECRET)).toMatchObject({
            email: 'teacher@test.com',
            role: 'Teacher'
        });
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"event":"login.success"'));
    });

    test('all attendance routes require a bearer token', async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.AUTH_USERS_JSON = JSON.stringify([
            { email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' }
        ]);

        const app = loadApp();
        const requests = [
            request(app).post('/api/attendance/checkin').send({
                child_name: 'Alice',
                arrival_time: '09:00',
                date: '2026-09-07'
            }),
            request(app).put('/api/attendance/checkout/1').send({ departure_time: '17:00' }),
            request(app).put('/api/attendance/1').send({ arrival_time: '08:45' }),
            request(app).get('/api/attendance/report?from=2026-09-07&to=2026-09-07')
        ];

        const responses = await Promise.all(requests);

        responses.forEach((response) => {
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('No token provided');
        });
    });

    test('attendance routes deny authenticated users with unauthorized roles', async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.AUTH_USERS_JSON = JSON.stringify([
            { email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' }
        ]);

        const app = loadApp();
        const token = jwt.sign(
            { email: 'parent@test.com', role: 'Parent' },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        const response = await request(app)
            .post('/api/attendance/checkin')
            .set('Authorization', 'Bearer ' + token)
            .send({
                child_name: 'Alice',
                arrival_time: '09:00',
                date: '2026-09-07'
            });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Insufficient permissions');
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"event":"role.denied"'));
    });

    test('login fails closed when JWT_SECRET is not configured', async () => {
        delete process.env.JWT_SECRET;
        process.env.AUTH_USERS_JSON = JSON.stringify([
            { email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' }
        ]);

        const app = loadApp();
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Authentication is not configured');
    });

    test('login is rate-limited after repeated authentication attempts', async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.AUTH_USERS_JSON = JSON.stringify([
            { email: 'teacher@test.com', password: 'teacher-pass', role: 'Teacher' }
        ]);
        process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '2';

        const app = loadApp();

        const firstResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@test.com', password: 'wrong-pass', role: 'Teacher' });
        const secondResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@test.com', password: 'wrong-pass', role: 'Teacher' });
        const thirdResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@test.com', password: 'wrong-pass', role: 'Teacher' });

        expect(firstResponse.status).toBe(401);
        expect(secondResponse.status).toBe(401);
        expect(thirdResponse.status).toBe(429);
        expect(thirdResponse.body.error).toBe('Too many authentication attempts. Please try again later.');
    });
});
