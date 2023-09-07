const ctas = require('./ctas');
const text = require('./text');
const icon = require('./icon');
// merge commons with image object
const merged = Object.assign(icon, text, ctas);
// add directional property for media type section
merged.isReverse = false;

module.exports = merged;