
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/VenuePaymentConfig'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));
const venuePaymentConfigFixtureHelper =
  require(path.join(__dirname, 'helpers/venue-payment-config'))();

describe('Venue payment config', () => {
  beforeAll((next) => {
    venuePaymentConfigFixtureHelper.setupFixtures(app);
    next();
  });
  afterAll((next) => {
    venuePaymentConfigFixtureHelper.teardownFixtures(app);
    next();
  });

  describe('When user not in context', () => {
    it('Add venue payment config should return 401', (next) => {
      fixtures.forEach((venuePaymentConfig) => {
        request(app)
          .post('/api/payment-config')
          .set('Accept', 'application/json')
          .send(venuePaymentConfig)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
    });

    it('List venue payment config should return 401', (next) => {
      request(app)
        .get('/api/payment-config')
        .set('Accept', 'application/json')
        .expect(401, (err, res) => {
          expect(err).toBe(null);
          expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
          next();
        });
    });
  });

  describe('When user in context', () => {
    let token = null;
    beforeAll((next) => {
      request(app)
        .post('/api/users/login')
        .set('Accept', 'application/json')
        .send({
          username: 'generalUser',
          password: 'password',
        })
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          token = res.body.id;
          expect(res.body.userId).toEqual(2);
          next();
        });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('Add venue payment config should return 200', (next) => {
      fixtures.forEach((venuePaymentConfig) => {
        request(app)
          .post('/api/payment-config')
          .set('Accept', 'application/json')
          .query({'access_token': token})
          .send(venuePaymentConfig)
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });
    });

    it('List should return 5 objects', (next) => {
      request(app)
        .get('/api/payment-config')
        .set('Accept', 'application/json')
        .query({'access_token': token})
        .expect(200, (err, res) => {
          expect(err).toBe(null);
          expect(res.body).not.toBe(null);
          expect(res.body.length).toEqual(5);
          next();
        });
    });

    it('delete should return 404 Not Found', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .delete('/api/payment-config/1')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(404, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });
    });
  });
});
