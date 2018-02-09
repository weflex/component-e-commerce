
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/ProductPricing'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Product pricing', () => {
  describe('When user not in context', () => {
    it('Add product pricing should return 401', (next) => {
      fixtures.forEach((productPricing) => {
        request(app)
          .post('/api/product-pricing')
          .set('Accept', 'application/json')
          .send(productPricing)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
    });
    it('List product pricing should return 401', (next) => {
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

  describe('With user in context', () => {
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

    it('should create new price', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .post('/api/product-pricing')
          .set('Accept', 'application/json')
          .query({'access_token': token})
          .send(fixtures[0])
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });
    });

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('should create new price when update price', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .put('/api/product-pricing/1')
          .set('Accept', 'application/json')
          .send(fixtures[1])
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.id).toEqual(2);
            expect(res.body.unitPrice).toEqual(1001);
            next();
          });
      });
    });

    it('delete should return 404 Not Found', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .delete('/api/product-pricing/1')
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

    it('should return price history in descending order', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/product-pricing')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.length).toBeGreaterThanOrEqual(2);
            next();
          });
      });
    });
  });

  describe('Remote methods', () => {
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

    it('latest should return latest price', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/product-pricing/1/latest')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).toEqual({price: 1001});
            next();
          });
      });
    });
  });

  describe('Model methods', () => {
    it('calling replaceOrCreate should create a new instance with new ID',
      (next) => {
        app.models.ProductPricing.replaceOrCreate(fixtures[1], null,
          (err, instance) => {
            expect(instance.id).not.toEqual(fixtures[1].id);
            next();
          });
      });
  });
});
