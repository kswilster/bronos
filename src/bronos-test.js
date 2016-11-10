require('babel-polyfill');

import Utils from './utils';

var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var imageToAscii = require("image-to-ascii");
var stringify = require("asciify-pixel-matrix");

const app = {

  run: async function() {
    await Utils.startSonosServer();
    console.log('server started');
  }

};

app.run();
