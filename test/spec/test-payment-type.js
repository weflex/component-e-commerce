
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/PaymentType'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Payment type', () => {
  describe('When user not in context', () => {
    it('Add product type should return 401', (next) => {
      fixtures.forEach((paymentType) => {
        request(app)
          .post('/api/product-category')
          .set('Accept', 'application/json')
          .send(paymentType)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
    });
    it('List payment types should return 401', (next) => {
      request(app)
        .get('/api/payment-type')
        .set('Accept', 'application/json')
        .expect(401, (err, res) => {
          expect(err).toBe(null);
          expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
          next();
        });
    });
  });

  describe('List payment types with user in context', () => {
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

    it('should add 10 payment method', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((paymentType) => {
          request(app)
            .post('/api/payment-type')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(paymentType)
            .expect(200, (err, res) => {
              // console.log(err);
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('should return at least 10 objects', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/payment-type')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.length).toBeGreaterThanOrEqual(10);
            next();
          });
      });
    });

    it('should return at least 5 objects for each locale', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/payment-type')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
            filter: '{"locale": "en"}',
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.length).toBeGreaterThanOrEqual(5);
            next();
          });
      });
    });
  });
});
