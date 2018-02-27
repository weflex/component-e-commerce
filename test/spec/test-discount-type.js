
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/DiscountType'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Discount Type', () => {
  describe('When user not in context', () => {
    it('Add discount type should return 401', (next) => {
      fixtures.forEach((discountType) => {
        request(app)
          .post('/api/discount-type')
          .set('Accept', 'application/json')
          .send(discountType)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
    });

    it('List discount type should return 401', (next) => {
      request(app)
        .get('/api/discount-type')
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

    it('Add discount type should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((discountType) => {
          request(app)
            .post('/api/discount-type')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(discountType)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('Modify discount type should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((discountType) => {
          discountType.id = 1;
          discountType.discountTypeDetail = [
            {
              'id': 1,
              'title': 'XXX',
              'description': 'XXX description',
              'locale': 'en',
            },
          ];
          request(app)
            .put('/api/discount-type/1')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(discountType)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('Delete discount type should return 404 Not Found', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .delete('/api/discount-type/1')
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

    it('List discount type should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/discount-type')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
            filter: '{"id": 2}',
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            next();
          });
      });
    });
  });
});
