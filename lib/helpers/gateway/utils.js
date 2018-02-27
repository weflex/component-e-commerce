/**
 * Utilitly methods shared in gateway module
 * @module gateway:utils
 * @author Prashant Balan <prash.balan@theweflex.com>
 */

module.exports = function utils() {
  /**
     * @access package
     * @param {Object} req Request object
     * @return {String} Client IP Address
     */
  const getClientIp = (req) => {
    return req.headers['x-forwarded-for'].split(',').pop() ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.connection.socket.remoteAddress;
  };

  return {
    getClientIp: getClientIp,
  };
};
