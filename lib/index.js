
/**
 * Module dependencies.
 */
const path = require('path');
const SG = require('strong-globalize');
SG.SetRootDir(path.join(__dirname, '..'));
const g = SG();
const commerce = require('./commerce');
var exports = module.exports = commerce;
