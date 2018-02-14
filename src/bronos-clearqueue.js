require('babel-polyfill');
import Zone from './models/zone';

const app = {
  async run() {
    const zone = await Zone.getDefaultZone();
    zone.clearQueue();
  },
}

app.run();