
const path = require('path');
const request = require('supertest');
const LoopBackContext = require('loopback-context');

const SIMPLE_APP = path.join(__dirname, '..', 'fixtures', 'simple-app');
const app = require(path.join(SIMPLE_APP, 'server/server.js'));

describe('User Context Middleware', () => {
  describe('Without loopback context', () => {
    it('should return null', () => {
      const currentUser = app.models.user.getCurrentUser();

      expect(currentUser).toBe(null);
    });
  });

  describe('With user in loopback context', () => {
    it('should return the user', () => {
      LoopBackContext.runInContext(() => {
        const loopbackContext = LoopBackContext.getCurrentContext();
        const user = {
          id: 'generalUser',
          username: 'generalUser',
          password: '$2a$10$Hb5a4OK7ZK97zdziGLSYgOScOy2lRQi0Kd2RCkldxRk0hZo6Eemy6', // eslint-disable-line
          email: 'generalUser@theweflex.com',
        };

        loopbackContext.set('currentUser', user);
        expect(app.models.user.getCurrentUser()).toEqual(user);
      });
    });
  });
});
