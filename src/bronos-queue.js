require('babel-polyfill');
import Utils from './utils';
import chalk from 'chalk';
import Zone from './models/zone';
const { get } = Ember;

const TERMINAL_WIDTH = process.stdout.columns;
const HORIZONTAL_RULE = '-'.repeat(TERMINAL_WIDTH);

// TODO: what to do if queue is not in use?
// NOTE: queue in use is indicated by zone.state.currentTrack.type === 'track'
const run = async function() {
  const currentZone = await Zone.getDefaultZone();
  const queue = await currentZone.getQueue();

  const trackNo = parseInt(get(currentZone, 'state').trackNo);

  // show at most 9 tracks on either side of the current track
  const minTrack = trackNo - 9;
  const maxTrack = trackNo + 9;
  const queueInUse = get(currentZone, 'state').currentTrack.type === 'track';
  const queueInUseText = queueInUse ? 'QUEUE' : 'QUEUE (Not in use)';

  // highlight current track if queue is in use
  const highlight = queueInUse ? chalk.bold.cyan : (text) => text;

  console.log(getStatusFromZone(currentZone));
  console.log();
  console.log(queueInUseText);

  if (trackNo === 1) {
    console.log(highlight(HORIZONTAL_RULE));
  } else {
    console.log(HORIZONTAL_RULE);
  }

  queue.forEach(function(track, index) {
    // sonos is 1-indexed
    index++;
    if (index < minTrack || index > maxTrack) {
      return;
    }

    if (index === trackNo) {
      console.log(highlight(floatText(track.title, index)));
      console.log(highlight(track.artist));
      console.log(highlight(HORIZONTAL_RULE));
    } else {
      console.log(floatText(track.title, index));
      console.log(track.artist);

      if (index + 1 === trackNo) {
        console.log(highlight(HORIZONTAL_RULE));
      } else {
        console.log(HORIZONTAL_RULE);
      }
    }
  });
};

function floatText(left, right) {
  const leftWidth = `${left}`.length;
  const rightWidth = `${right}`.length;
  const numSpaces = Math.max(TERMINAL_WIDTH - leftWidth - rightWidth, 0) ;
  return `${left}${' '.repeat(numSpaces)}${right}`;
};

function getStatusFromZone(zone) {
  // TODO: look into why Ember.get doesn't work for deep keys
  const roomName = get(zone, 'roomName');
  const state = get(zone, 'state');
  const { playbackState, volume, currentTrack, playMode } = state;
  const { artist, album, title } = currentTrack;
  const { shuffle, crossfade, repeat } = playMode;

  const playbackStateIcon = (playbackState === 'STOPPED') ? '❙❙' : '►';
  const track = title;
  const shuffleState = shuffle ? 'ON' : 'OFF';
  const crossfadeState = crossfade ? 'ON' : 'OFF';
  const repeatState = repeat ? 'ON' : 'OFF';

  const playbackStateText = `${playbackStateIcon} ${track} - ${artist}`;
  const volumeText = `Volume: ${volume}`;
  const shuffleText = `Shuffle: ${shuffleState}`;
  const crossfadeText = `Crossfade: ${crossfadeState}`;
  const repeatText = `Repeat: ${repeatState}`;

  const statusArray = [];
  statusArray.push(roomName);
  if (track && track.length) {
    statusArray.push(`    ${playbackStateText}`);
  } else {
    statusArray.push('    No song playing');
  }
  statusArray.push(`    ${volumeText}`);
  statusArray.push(`    ${shuffleText}`);
  statusArray.push(`    ${repeatText}`);
  statusArray.push(`    ${crossfadeText}`);
  return statusArray.join('\n');
};

run();
