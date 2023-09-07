const ctas = require('./ctas');
const text = require('./text');
const lottie = require('./lottie');
// merge commons with image object
const merged = Object.assign(lottie, text, ctas);
// add directional property for media type section
merged.isReverse = false;

module.exports = merged;