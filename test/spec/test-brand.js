
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/Brand'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Brand', () => {
  describe('When user not in context', () => {
    it('Add brand should return 401', (next) => {
      fixtures.forEach((brand) => {
        request(app)
          .post('/api/brand')
          .set('Accept', 'application/json')
          .send(brand)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
    });

    it('List brand should return 401', (next) => {
      request(app)
        .get('/api/brand')
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

    it('Add brand should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((brand) => {
          request(app)
            .post('/api/brand')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(brand)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('Modify brand should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((brand) => {
          brand.id = 1;
          brand.brandDetail = [
            {
              'id': '1',
              'brandName': 'Coca Cola',
              'locale': 'en',
            },
          ];
          request(app)
            .put('/api/brand/1')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(brand)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('Soft delete brand should return count 1', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .delete('/api/brand/1')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).toEqual({count: 1});
            next();
          });
      });
    });

    it('Soft delete brand should return error', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .delete('/api/brand')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            expect(err).not.toBe(null);
            next();
          });
      });
    });

    it('List brand with id filter should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/brand')
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

    it('List brand with existing include should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/brand')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
            filter: '{"include": {"relation": "brandDetail"}}',
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
