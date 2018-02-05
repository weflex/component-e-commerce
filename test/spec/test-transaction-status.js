
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const fixtures = require(path.join(SIMPLE_APP, 'fixtures/TransactionStatus'));
let app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('Transaction Status', () => {
  describe('When user not in context', () => {
    it('Add transaction status should return 401', (next) => {
      fixtures.forEach((transactionStatus) => {
        request(app)
          .post('/api/transaction-status')
          .set('Accept', 'application/json')
          .send(transactionStatus)
          .expect(401, (err, res) => {
            expect(err).toBe(null);
            expect(res.body.error.code).toBe('AUTHORIZATION_REQUIRED');
            next();
          });
      });
    });

    it('List transaction status should return 401', (next) => {
      request(app)
        .get('/api/transaction-status')
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

    it('Add transaction status should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((transactionStatus) => {
          request(app)
            .post('/api/transaction-status')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(transactionStatus)
            .expect(200, (err, res) => {
              console.log(err);
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('Modify transaction status should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        fixtures.forEach((transactionStatus) => {
          transactionStatus.id = 1;
          transactionStatus.transactionStatusDetail = [
            {
              'id': 1,
              'status': 'XXX',
              'locale': 'en',
            },
          ];
          request(app)
            .put('/api/transaction-status/1')
            .set('Accept', 'application/json')
            .query({
              'access_token': token,
            })
            .send(transactionStatus)
            .expect(200, (err, res) => {
              expect(err).toBe(null);
              expect(res.body).not.toBe(null);
              next();
            });
        });
      });
    });

    it('Delete transaction status should return 404 Not Found', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .delete('/api/transaction-status/1')
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

    it('List transaction status should return 200', (next) => {
      LoopBackContext.runInContext(() => {
        request(app)
          .get('/api/transaction-status')
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
