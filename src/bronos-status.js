require('babel-polyfill');
var program = require('commander');
import _ from 'underscore';
import axios from 'axios';
import Utils from '~/utils';
import Zone from '~/models/zone';
import Command from '~/models/command';

var os = require('os');
var fs = require('fs');
var stringify = require("asciify-pixel-matrix");

try {
  var imageToAscii = require("image-to-ascii");
} catch (e) {}

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

function handleError (err) {
  console.error('ERROR: ' + err);
  exit();
}

const app = Command.extend({
  needsSpotifyApi: true,

  main: async function({ showAlbumArt = false } = {}) {
    showAlbumArt = imageToAscii ? showAlbumArt : false;

    var zone;
    try {
      zone = await Zone.getDefaultZone({ serialize: true });
    } catch (e) {
      console.error(e);
      process.exit();
    }

    const playbackStateIcon = (zone.state.playbackState === 'PAUSED_PLAYBACK') ? '❙❙' : '►';
    const artist = zone.state.currentTrack.artist;
    const album = zone.state.currentTrack.album;
    const track = zone.state.currentTrack.title;
    const shuffleState = zone.state.playMode.shuffle ? 'ON' : 'OFF';
    const crossfadeState = zone.state.playMode.crossfade ? 'ON' : 'OFF';
    const repeatState = zone.state.playMode.repeat.toUpperCase();

    const playbackStateText = `${playbackStateIcon} ${track} - ${artist}`;
    const volumeText = `Volume: ${zone.state.volume}`;
    const shuffleText = `Shuffle: ${shuffleState}`;
    const crossfadeText = `Crossfade: ${crossfadeState}`;
    const repeatText = `Repeat: ${repeatState}`;

    const statusArray = [];
    statusArray.push(zone.roomName);
    if (track && track.length) {
      statusArray.push(`    ${playbackStateText}`);
    } else {
      statusArray.push('    No song playing');
    }
    statusArray.push(`    ${volumeText}`);
    statusArray.push(`    ${shuffleText}`);
    statusArray.push(`    ${repeatText}`);
    statusArray.push(`    ${crossfadeText}`);

    if (album && album.length && showAlbumArt) {
      try {
        const albumArtUrl = await this.getAlbumArtURL(artist, album);
        const albumArt = await this.createAlbumArtMatrix(albumArtUrl, statusArray);
        console.log(albumArt);
      } catch (e) {
        console.log('error showing ascii art', e);
        console.log(statusArray.join('\n'));
      }
    } else {
      console.log(statusArray.join('\n'));
    }
  },

  getAlbumArtURL: async function(artist, album) {
    const spotify = this.get('spotifyApi');
    const albums = await spotify.findAlbums(album);
    return albums[0].images[2].url;
  },

  createAlbumArtMatrix: async function(imgUrl, textArray) {
    if (!imageToAscii) return;

    const promise = new Promise((resolve, reject) => {
      imageToAscii(imgUrl, {
        bg: true,
        fg: false,
        stringify: false,
        concat: false,
        size: {
          height: '40'
        }
      }, (err, converted) => {
        var matrixWithText = this.addTextToAscii(converted, textArray, {
          anchor: 'BOTTOM_RIGHT',
          margin: { bottom: 1, right: 2 }
        });

        resolve(matrixWithText);
      });
    });

    return promise;
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
          // px.char = ' ';
          px.char = px.char;
        }
      });
    });

    return stringify.stringifyMatrix(ascii);
  },
});

program
  .option('-a, --art', 'Show album art in ascii text')
  .parse(process.argv);

app.create().run({ showAlbumArt: program.art });
