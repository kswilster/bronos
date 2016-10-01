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
      '    No song playing',
      '    Volume: 0',
      '    Shuffle: OFF',
      '    Repeat: NONE',
      '    Crossfade: OFF'
    ];

    imageToAscii("http://www.nme.com/images/StrokesAngles600.jpg", {
      bg: true,
      fg: false,
      stringify: false,
      concat: false,
      size: {
        height: '32'
      }
    }, (err, converted) => {
      var i = 0;
       var statusArrayHeight = statusArray.length;
       var statusArrayWidth = _.max(statusArray, (row) => {
         return row.length;
       }).length;

       converted.forEach((cRow, rowIndex) => {
         cRow.forEach((px, pxIndex) => {
             const statusRow = statusArray[rowIndex];
             const statusChar = statusRow && statusRow.charAt(pxIndex) || ' ';
             if ((rowIndex < statusArrayHeight) && (pxIndex < statusArrayWidth)) {
               px.pixel.r = 0;
               px.pixel.g = 0;
               px.pixel.b = 0;
             }
             px.char = statusChar;
         });
       });
      // const matrixWithText = this.addTextToAscii(converted, statusArray)
      console.log(stringify.stringifyMatrix(converted));
    });
  },

  // NOTE: anchor in ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');
  // addTextToAscii(ascii, textArray, { color, anchor, margin }) {
  //   const color = color || { r: 0, g: 0, b: 0, a: 0 };
  //   const anchor = anchor || 'TOP_LEFT';
  //   const margin = margin || { top: 0, left: 0, bottom: 0, right: 0 };
  //
  //   var i = 0;
  //   const asciiHeight = ascii.length;
  //   const statusArrayHeight = statusArray.length;
  //   const statusArrayWidth = _.max(statusArray, (row) => {
  //     return row.length;
  //   }).length;
  //
  //
  //   var x0, x1, y0, y1;
  //   switch(anchor) {
  //     case 'TOP_LEFT':
  //       x0 = margin.left;
  //       y1 = margin.top;
  //     case 'TOP_RIGHT':
  //       x0 = 0;
  //     case 'BOTTOM_LEFT':
  //     case 'BOTTOM_RIGHT':
  //     default:
  //       console.err('invalid anchor: ' + anchor);
  //   }
  //
  //   ascii.forEach((cRow, rowIndex) => {
  //     cRow.forEach((px, pxIndex) => {
  //         const statusRow = statusArray[rowIndex - 1];
  //         const statusChar = statusRow && statusRow.charAt(pxIndex - 1) || ' ';
  //         if ((rowIndex > 0)
  //           && (rowIndex < statusArrayHeight + 1)
  //           && (pxIndex > 0)
  //           && (pxIndex < statusArrayWidth + 1)
  //         ) {
  //           px.pixel.r = 0;
  //           px.pixel.g = 0;
  //           px.pixel.b = 0;
  //         }
  //         px.char = statusChar;
  //     });
  //   });
  // },

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
