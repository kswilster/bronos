require('babel-polyfill');
import Utils from './utils';

function run() {
  const currentZone = Utils.config.zone;
  Utils.play(currentZone.roomName);
}

run();
