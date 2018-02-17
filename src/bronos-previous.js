require('babel-polyfill');
import Zone from '~/models/zone';
import Command from '~/models/command';

const app = Command.extend({
  async run() {
    const zone = await Zone.getDefaultZone();
    zone.previous();
  },
});

app.create().run();
