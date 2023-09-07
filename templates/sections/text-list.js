const ctas = require('./ctas');
const text = require('./text');
const list = require('./list');
// merge commons with image object
const merged = Object.assign(list, text, ctas);
// add directional property for media type section
merged.isReverse = false;

module.exports = merged;