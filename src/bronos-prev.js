require('babel-polyfill');
import Utils from './utils';

Utils.getCurrentPlayer().then((player) => {
  player.previousTrack();
});
