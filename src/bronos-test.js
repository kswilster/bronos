require('babel-polyfill');

var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var imageToAscii = require("image-to-ascii");
var stringify = require("asciify-pixel-matrix");

function sleep(timeout) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

var SonosDiscovery = require('sonos-discovery');

const app = {
  setupSonosDiscovery: async function() {
    const settings = {
      port: 5005,
      securePort: 5006,
      cacheDir: './cache',
      webroot: webroot,
      announceVolume: 40
    };

    const discovery = new SonosDiscovery(settings);
    await sleep(1000);
    const player = discovery.getPlayer('HD-💞💓');
    player.play();
  },

  run: async function() {
    // const discovery = this.getSonosDiscovery();
    // await sleep(1000);
    // const player = discovery.getPlayer('HD-💞💓');
    // player.play();

    const status = 'Dandelion\n' +
      '\tNo song playing\n' +
      '\tVolume: 0\n' +
  	  '\tShuffle: OFF\n' +
  	  '\tRepeat: NONE\n' +
  	  '\tCrossfade: OFF`\n';

    const statusArray = [
      'Dandelion',
      '    ► Clint Eastwood - Gorillaz',
      '    Volume: 64',
      '    Shuffle: OFF',
      '    Repeat: NONE',
      '    Crossfade: OFF'
    ];

    imageToAscii("http://www.vblurpage.com/images/gorillaz_gorillaz_cd_cover_big.jpg", {
      bg: true,
      fg: false,
      stringify: false,
      concat: false,
      size: {
        height: '40'
      }
    }, (err, converted) => {
      var matrixWithText = this.addTextToAscii(converted, statusArray, {
        anchor: 'BOTTOM_RIGHT',
        margin: { bottom: 1, right: 2 }
      })
      console.log(matrixWithText);
    });
  },

  // NOTE: anchor in ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');
  addTextToAscii(ascii, statusArray, { color, anchor, margin }={}) {
    color = color || { r: 0, g: 0, b: 0, a: 0 };
    anchor = anchor || 'TOP_LEFT';
    margin = margin || { top: 0, left: 0, bottom: 0, right: 0 };

    const asciiHeight = ascii.length;
    const asciiWidth = ascii[0].length;
    const statusArrayHeight = statusArray.length;
    const statusArrayWidth = _.max(statusArray, (row) => {
      return row.length;
    }).length;

    var x0, x1, y0, y1;
    switch(anchor) {
      case 'TOP_LEFT':
        x0 = margin.left;
        x1 = margin.left + statusArrayWidth;
        y0 = margin.top;
        y1 = margin.top + statusArrayHeight;
        break;
      case 'TOP_RIGHT':
        x0 = asciiWidth - statusArrayWidth - margin.right;
        x1 = asciiWidth - margin.right;
        y0 = margin.top;
        y1 = margin.top + statusArrayHeight;
        break;
      case 'BOTTOM_LEFT':
        x0 = margin.left;
        x1 = margin.left + statusArrayWidth;
        y0 = asciiHeight - statusArrayHeight - margin.bottom;
        y1 = asciiHeight - margin.bottom;
        break;
      case 'BOTTOM_RIGHT':
        x0 = asciiWidth - statusArrayWidth - margin.right;
        x1 = asciiWidth - margin.right;
        y0 = asciiHeight - statusArrayHeight - margin.bottom;
        y1 = asciiHeight - margin.bottom;
        break;
      default:
        console.log('invalid anchor: ' + anchor);
    }

    function inBoundedBox(x, y, x0, x1, y0, y1) {
      return (x >= x0 && x < x1 && y >= y0 && y < y1);
    }

    ascii.forEach((cRow, rowIndex) => {
      cRow.forEach((px, pxIndex) => {
        if (inBoundedBox(pxIndex, rowIndex, x0, x1, y0, y1)) {
          const statusRow = statusArray[rowIndex - y0];
          const statusChar = statusRow && statusRow.charAt(pxIndex - x0) || ' ';
          px.pixel.r = color.r;
          px.pixel.g = color.g;
          px.pixel.b = color.b;
          px.pixel.a = color.a;
          px.char = statusChar;
        } else {
          px.char = ' ';
        }
      });
    });

    return stringify.stringifyMatrix(ascii);
  },

  getSonosDiscovery: function() {
    const settings = {
      port: 5005,
      securePort: 5006,
      cacheDir: './cache',
      webroot: webroot,
      announceVolume: 40
    };

    const discovery = new SonosDiscovery(settings);
    return discovery;
  }
};

app.run();
// app.setupSonosDiscovery();
