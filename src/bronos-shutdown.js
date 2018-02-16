require('babel-polyfill');
import Utils from '~/utils';

const app = {
  async run() {
    const sonosServerPID = await Utils.getSonosServerPID();
    if (!sonosServerPID) {
      console.error('no sonos server found for port 5005');
    } else {
      process.kill(sonosServerPID);
      console.log('sonos server sent SIGTERM');
    }
  },
}

app.run();
