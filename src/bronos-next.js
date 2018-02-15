require('babel-polyfill');
import Zone from '~/models/zone';
import Command from '~/models/command';

const app = Command.extend({
  async main() {
    const zone = await Zone.getDefaultZone();
    zone.next();
  },
});

app.create().run();
