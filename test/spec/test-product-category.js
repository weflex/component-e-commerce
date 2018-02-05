
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/ProductCategory'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Product category', () => {
  describe('When user not in context', () => {
    it('Add product category should return 401', (next) => {
      fixtures.forEach((productCategory) => {
        request(app)
          .post('/api/product-category')
          .set('Accept', 'application/json')
          .send(productCategory)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
    });

    it('List product category should return 401', (next) => {
      request(app)
        .get('/api/product-category')
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

    it('Add product category should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((productCategory) => {
          request(app)
            .post('/api/product-category')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(productCategory)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('Modify product category should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((productCategory) => {
          productCategory.id = 1;
          productCategory.productCategoryDetail = [
            {
              'id': 1,
              'category': 'Class Packagez',
              'locale': 'en',
            },
          ];
          request(app)
            .put('/api/product-category/1')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(productCategory)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('Soft delete product category should return count 1', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .delete('/api/product-category/1')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .send({id: 1})
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).toEqual({count: 1});
            next();
          });
      });
    });

    it('List product category should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/product-category')
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
