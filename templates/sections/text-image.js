const ctas = require('./ctas');
const text = require('./text');
const image = require('./image');
// merge commons with image object
const merged = Object.assign(image, text, ctas);
// add directional property for media type section
merged.isReverse = false;

module.exports = merged;