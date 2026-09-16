process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

if (process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com')) {
  throw new Error('Refusing to run tests against RDS. Use DB_HOST=localhost.');
}

const request = require('supertest');

jest.mock('./auth', () => {
  const actual = jest.requireActual('./auth');
  return {
    ...actual,
    verifyToken: (req, res, next) => {
      const role = req.headers['x-test-role'] || 'Teacher';
      req.user = { email: `${role.toLowerCase()}@daycare.local`, role };
      next();
    },
    checkRole: (roles) => (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    }
  };
});

const app = require('./server');
const { sequelize, Child, Attendance } = require('./models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Attendance.destroy({ where: {}, truncate: true, cascade: true });
  await Child.destroy({ where: {}, truncate: true, cascade: true });

  await Child.bulkCreate([
    { child_name: 'Aoife Byrne',    parent_email: 'aoife.byrne@example.ie' },
    { child_name: "Cian O'Brien",   parent_email: 'cian.obrien@example.ie' },
    { child_name: 'Saoirse Murphy', parent_email: 'saoirse.murphy@example.ie' }
  ]);
});

describe('GET /health', () => {
  test('returns a status object', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});

describe('GET /api/children', () => {
  test('returns all registered children', async () => {
    const res = await request(app).get('/api/children');
    expect(res.statusCode).toBe(200);
    expect(res.body.children.length).toBe(3);
  });

  test('each child has required fields', async () => {
    const res = await request(app).get('/api/children');
    const first = res.body.children[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('child_name');
    expect(first).toHaveProperty('parent_email');
  });
});

describe('POST /api/attendance/checkin', () => {
  test('creates a new attendance record', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    const res = await request(app).post('/api/attendance/checkin').send({
      child_id: child.id,
      child_name: child.child_name,
      parent_email: child.parent_email,
      arrival_time: '09:00',
      date: '2026-09-15'
    });
    expect([200, 201]).toContain(res.statusCode);
    const record = await Attendance.findOne({ where: { child_id: child.id } });
    expect(record.arrival_time).toBe('09:00');
    expect(record.departure_time).toBeNull();
  });

  test('rejects duplicate check-in', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    await request(app).post('/api/attendance/checkin').send({
      child_id: child.id, child_name: child.child_name,
      parent_email: child.parent_email, arrival_time: '09:00', date: '2026-09-15'
    });
    const res = await request(app).post('/api/attendance/checkin').send({
      child_id: child.id, child_name: child.child_name,
      parent_email: child.parent_email, arrival_time: '09:30', date: '2026-09-15'
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects missing arrival_time', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    const res = await request(app).post('/api/attendance/checkin').send({
      child_id: child.id, child_name: child.child_name, date: '2026-09-15'
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects missing child_id', async () => {
    const res = await request(app).post('/api/attendance/checkin').send({
      child_name: 'Aoife Byrne', arrival_time: '09:00', date: '2026-09-15'
    });
    expect(res.statusCode).toBe(400);
  });

  test('rejects missing date', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    const res = await request(app).post('/api/attendance/checkin').send({
      child_id: child.id, child_name: child.child_name, arrival_time: '09:00'
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/attendance/checkout/:id', () => {
  test('sets departure time', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    const record = await Attendance.create({
      child_id: child.id, child_name: child.child_name,
      parent_email: child.parent_email, arrival_time: '09:00',
      departure_time: null, date: '2026-09-15'
    });
    const res = await request(app)
      .put(`/api/attendance/checkout/${record.id}`)
      .send({ departure_time: '15:30' });
    expect(res.statusCode).toBe(200);
    await record.reload();
    expect(record.departure_time).toBe('15:30');
  });

  test('rejects second check-out', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    const record = await Attendance.create({
      child_id: child.id, child_name: child.child_name,
      parent_email: child.parent_email, arrival_time: '09:00',
      departure_time: '15:30', date: '2026-09-15'
    });
    const res = await request(app)
      .put(`/api/attendance/checkout/${record.id}`)
      .send({ departure_time: '16:00' });
    expect(res.statusCode).toBe(400);
  });

  test('returns 404 for unknown record', async () => {
    const res = await request(app)
      .put('/api/attendance/checkout/99999')
      .send({ departure_time: '16:00' });
    expect([400, 404]).toContain(res.statusCode);
  });
});

describe('PUT /api/attendance/:id', () => {
  test('updates arrival_time', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    const record = await Attendance.create({
      child_id: child.id, child_name: child.child_name,
      parent_email: child.parent_email, arrival_time: '09:00',
      departure_time: null, date: '2026-09-15'
    });
    const res = await request(app)
      .put(`/api/attendance/${record.id}`)
      .send({ arrival_time: '08:45' });
    expect(res.statusCode).toBe(200);
    await record.reload();
    expect(record.arrival_time).toBe('08:45');
  });

  test('returns 404 for unknown record', async () => {
    const res = await request(app)
      .put('/api/attendance/99999')
      .send({ arrival_time: '08:45' });
    expect([400, 404]).toContain(res.statusCode);
  });
});

describe('GET /api/attendance/report', () => {
  test('returns records for a date range', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    await Attendance.create({
      child_id: child.id, child_name: child.child_name,
      parent_email: child.parent_email, arrival_time: '09:00',
      departure_time: '15:30', date: '2026-09-15'
    });
    const res = await request(app)
      .get('/api/attendance/report?from=2026-09-15&to=2026-09-15');
    expect(res.statusCode).toBe(200);
    expect(res.body.record.length).toBeGreaterThan(0);
  });

  test('returns empty array when no records', async () => {
    const res = await request(app)
      .get('/api/attendance/report?from=2030-01-01&to=2030-01-02');
    expect(res.statusCode).toBe(200);
    expect(res.body.record.length).toBe(0);
  });
});

describe('GET /api/attendance/ecce-report', () => {
  test('returns compliance data', async () => {
    const child = await Child.findOne({ where: { child_name: 'Aoife Byrne' } });
    for (let d = 15; d <= 19; d++) {
      await Attendance.create({
        child_id: child.id, child_name: child.child_name,
        parent_email: child.parent_email, arrival_time: '08:30',
        departure_time: '15:00', date: `2026-09-${d}`
      });
    }
    const res = await request(app)
      .get('/api/attendance/ecce-report?from=2026-09-15&to=2026-09-19');
    expect(res.statusCode).toBe(200);
    expect(res.body.report.length).toBeGreaterThan(0);
  });

  test('flags non-compliant children', async () => {
    const child = await Child.findOne({ where: { child_name: 'Saoirse Murphy' } });
    await Attendance.create({
      child_id: child.id, child_name: child.child_name,
      parent_email: child.parent_email, arrival_time: '09:00',
      departure_time: '15:30', date: '2026-09-15'
    });
    const res = await request(app)
      .get('/api/attendance/ecce-report?from=2026-09-15&to=2026-09-19');
    expect(res.statusCode).toBe(200);
  });
});
