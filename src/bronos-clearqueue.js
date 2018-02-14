require('babel-polyfill');
import Zone from '~/models/zone';
import Command from '~/models/zone';

const app = Command.extend({
  async run() {
    const zone = await Zone.getDefaultZone();
    zone.clearQueue();
  },
});

app.create().run();
