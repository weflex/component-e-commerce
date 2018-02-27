
const debug = require('debug')('component:commerce:context');
const Promise = require('bluebird');
const LoopBackContext = require('loopback-context');

module.exports = function userContextMiddleware() {
  debug('initializing user context middleware');
  // set current user to enable user access for remote methods
  return function userContext(req, res, next) {
    const loopbackContext = LoopBackContext.getCurrentContext({bind: true});

    next = loopbackContext.bind(next);

    if (!loopbackContext) {
      debug('No user context (loopback current context not found)');
      return next();
    }

    if (!req.accessToken) {
      debug('No user context (access token not found)');
      return next();
    }

    const {app} = req;
    const UserModel = app.options.userModel || 'User';

    return Promise.join(
      app.models[UserModel].findById(req.accessToken.userId),
      (user) => {
        if (!user) {
          return next(new Error('No user with this access token was found.'));
        }
        loopbackContext.set('currentUser', user);
        debug('currentUser', user);
        return next();
      })
      .catch(next);
  };
};
