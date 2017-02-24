require('babel-polyfill');
import Utils from './utils';

Utils.getCurrentPlayer().then((player) => {
  player.nextTrack();
  // TODO: call next track in background and shutdown player after some time
});
