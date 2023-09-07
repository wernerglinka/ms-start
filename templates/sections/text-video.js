const ctas = require('./ctas');
const text = require('./text');
const video = require('./video');
// merge commons with image object
const merged = Object.assign(video, text, ctas);
// add directional property for media type section
merged.isReverse = false;

module.exports = merged;