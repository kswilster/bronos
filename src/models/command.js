require('babel-polyfill');
import emberMetal from 'ember-metal';
import emberRuntime from 'ember-runtime';
import SpotifyApi from '~/models/spotify-api';
import RSVP from 'rsvp';
import Utils from '~/utils';

export default Ember.Object.extend({
  // most commands need the sonos api, most don't need spotify
  needsSonosApi: true,
  needsSpotifyApi: false,

  spotifyApi: null,
  sonosReady: false,

  async run() {
    const needsSpotifyApi = this.get('needsSpotifyApi');
    const needsSonosApi = this.get('needsSonosApi');
    const promises = {};
    if (needsSpotifyApi) {
      promises.spotifyApi = SpotifyApi.create().authenticate();
    }
    if (needsSonosApi) {
      promises.sonosReady = Utils.startSonosServer();
    }

    const { spotifyApi, sonosReady } = await RSVP.hash(promises);
    this.setProperties({ spotifyApi, sonosReady });
    this.main(...arguments);
  },

  main() {
    throw new Error('subclasses of Command should implement main');
  },
});
