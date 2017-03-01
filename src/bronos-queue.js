require('babel-polyfill');
import Utils from './utils';
import chalk from 'chalk';

const HORIZONTAL_RULE = '---------------------------------------------------------';

// TODO: what to do if queue is not in use?
// NOTE: queue in use is indicated by zone.state.currentTrack.type === 'track'
const run = async function() {
  const currentZone = await Utils.getCurrentZone();
  const queue = await Utils.getQueue(currentZone.roomName);
  const trackNo = parseInt(currentZone.state.trackNo);
  // show 9 tracks on either side of the current track
  const minTrack = trackNo - 9;
  const maxTrack = trackNo + 9;
  const queueInUse = currentZone.state.currentTrack.type === 'track';
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
      console.log(highlight(track.title));
      console.log(highlight(track.artist));
      console.log(highlight(HORIZONTAL_RULE));
    } else {
      console.log(track.title);
      console.log(track.artist);

      if (index + 1 === trackNo) {
        console.log(highlight(HORIZONTAL_RULE));
      } else {
        console.log(HORIZONTAL_RULE);
      }
    }
  });
};

function getStatusFromZone(zone) {
  const playbackStateIcon = (zone.state.playbackState === 'STOPPED') ? '❙❙' : '►';
  const artist = zone.state.currentTrack.artist;
  const album = zone.state.currentTrack.album;
  const track = zone.state.currentTrack.title;
  const shuffleState = zone.state.playMode.shuffle ? 'ON' : 'OFF';
  const crossfadeState = zone.state.playMode.crossfade ? 'ON' : 'OFF';
  const repeatState = zone.state.playMode.repeat ? 'ON' : 'OFF';

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
  return statusArray.join('\n');
};

run();
