
const debug = require('debug')('component:commerce:helper:accessUtil');
const _get = require('lodash').get;
const _set = require('lodash').set;
const LoopBackContext = require('loopback-context');

module.exports = class AccessUtils {
  constructor(app, options) {
    this.app = app;
  }
  /**
   * Register a custom remoting phase to make the current user details available from remoting contexts.
   */
  setupRemotingPhase() {
    this.app.remotes().phases
      .addBefore('invoke', 'options-from-request')
      .use((ctx, next) => {
        if (!_get(ctx, 'args.options.accessToken')) {
          return next();
        }
        _set(
          ctx,
          'args.options.currentUser',
          this.getCurrentUser()
        );
        return next();
      });
  }

  /**
   * Get the currently logged in user.
   *
   * @returns {Object} Returns the currently logged in user.
   */
  getCurrentUser() {
    const ctx = LoopBackContext.getCurrentContext({bind: true});
    const currentUser = (ctx && ctx.get('currentUser')) || null;

    return currentUser;
  }
};
