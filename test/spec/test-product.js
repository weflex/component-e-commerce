
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/Product'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Product', () => {
  describe('When user not in context', () => {
    it('Add product should return 401', (next) => {
      fixtures.forEach((product) => {
        request(app)
          .post('/api/product')
          .set('Accept', 'application/json')
          .send(product)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
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

    it('Add product should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((product) => {
          request(app)
            .post('/api/product')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(product)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
            });
        });
        next();
      });
    });

    it('Modify product should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((product) => {
          product.id = 1;
          product.productDetail = [
            {
              'id': 1,
              'productName': 'Protein powder',
              'productDescription': 'Gold Standard 100% Whey™ .',
              'brandId': '1',
              'attributes': {
                'color': '',
                'weight': '1',
                'weightUnit': 'lb(s)',
                'size': '',
              },
              'locale': 'en',
            },
          ];
          request(app)
            .put('/api/product/1')
            .set('Accept', 'application/json')
            .query({'access_token': token})
            .send(product)
            .expect(200, (err, res) => {
              let productDetail = res.body.productDetail[0];
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              expect(productDetail.attributes.weight).toEqual('1');
              expect(productDetail.productDescription).toEqual(
                'Gold Standard 100% Whey™ .');
              next();
            });
        });
      });
    });

    it('Soft delete product should return count 1', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .delete('/api/product/1')
          .set('Accept', 'application/json')
          .query({'access_token': token})
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).toEqual({count: 1});
            next();
          });
      });
    });

    it('List product should return product with productDetail', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/product')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
            filter: '{"id": 1}',
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body).not.toBe(null);
            expect(res.body.productDetail).not.toBe(null);
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

    afterAll((next) => {
      const loopbackContext = LoopBackContext.getCurrentContext();
      loopbackContext.set('currentUser', null);
      next();
    });

    it('product should be available', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .post('/api/product/1/available')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.product.isAvailable).toEqual(true);
            next();
          });
      });
    });

    it('product should be unavailable', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .post('/api/product/1/unavailable')
          .set('Accept', 'application/json')
          .query({
            'access_token': token,
          })
          .expect(200, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.product.isAvailable).toEqual(false);
            next();
          });
      });
    });
  });
});
