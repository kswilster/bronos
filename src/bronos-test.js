require('babel-polyfill');

var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var webroot = path.resolve(__dirname, 'static');
var imageToAscii = require("image-to-ascii");
var stringify = require("asciify-pixel-matrix");
var najax = require('najax');

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

function getAlbumArt(artist, album, callback) {
  var url = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=4683e61c88686384bc2861a94ace1cc5&artist=${artist}&album=${album}&format=json`
  var output = 'nothing';
  najax.get(url, function(body, status) {
    var json = JSON.parse(body)
    if (json['album']) {
      json['album']['image'].forEach(function(item) {
        if (item['size'] == 'extralarge') { callback(item['#text']); }
      });
    }
  });
}

function getAlbumsForArtist(artist, callback) {
  var url = "http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=cher&api_key=4683e61c88686384bc2861a94ace1cc5&format=json"
  najax.get(url, function(body, status) {
    var albums = JSON.parse(body)['topalbums']['album'].map(function(item) {
      return item['name'];
    });
    callback(artist, albums);
  });
}

function getTopArtists(callback) {
  var url = "http://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country=spain&api_key=4683e61c88686384bc2861a94ace1cc5&format=json"
  najax.get(url, function(body, status) {
    var array = JSON.parse(body)['topartists']['artist'].map(function(item) {
      return item['name'];
    });
    callback(array);
  });
}

function getRandomAlbumArtURL() {
  getTopArtists(function(artists) {
    artists.forEach(function(artist) {
      getAlbumsForArtist(artist, function(artist, albums) {
        albums.forEach(function(album) {
          getAlbumArt(artist, album, function(imageUrl) {
            if (imageUrl.length > 0) {
              logPixelArrayForUrl(imageUrl);
              console.log(`${artist} ${album}`)
            }
          });
        });
      })
    })
  })
}

function logPixelArrayForUrl(url) {
  imageToAscii(url, {
    bg: true,
    fg: false,
    stringify: false,
    concat: false,
    size: { height: '32' }
  }, (err, converted) => {
    var i = 0;
    converted.forEach((cRow, rowIndex) => { cRow.forEach((px, pxIndex) => { px.char = ' '; }); });
    console.log(stringify.stringifyMatrix(converted));
  });
}

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
    logPixelArrayForUrl("http://www.nme.com/images/StrokesAngles600.jpg");
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


getRandomAlbumArtURL()
//getTopArtists();
//getAlbumsForArtist('Cher', function(a,aa) { console.log(`${a} ${aa}`); })


//app.run();
// app.setupSonosDiscovery();
