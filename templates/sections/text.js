const ctas = require('./ctas');
const text = {
  "text": {
    "prefix": "",
    "title": "",
    "header": "",
    "subtitle": "",
    "prose": ""
  }
};

// merge commons with image object
const merged = Object.assign(text, ctas);
merged.hasCtas = false;

module.exports = merged;