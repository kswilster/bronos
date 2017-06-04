import Backbone from 'backbone';
import assert from 'assert';
import axios from 'axios';

// TODO: set this up somewhere else
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`...`);
const $ = require("jquery")(window);
Backbone.$ = $;

export default Backbone.Model.extend({

  idAttribute: 'roomName',

  // base url for most actions
  urlRoot() {
    const roomName = this.get('roomName');
    return `http://localhost:5005/${roomName}`;
  },

  // url just for fetch
  url() {
    const roomName = this.get('roomName');
    return `http://localhost:5005/zones/${roomName}/status`;
  },

  initialize({ roomName }) {
    // Zones require a roomName
    assert.ok(typeof roomName === 'string', 'Zone requires a roomName');
    this.axios = axios.create({
      baseURL: this.urlRoot(),
    });

    // TODO: less bad override
    this.axios._get = this.axios.get;
    this.axios.get = (url, ...rest) => {
      this._get(encodeURI(url), ...rest);
    }
  },

  // getter actions
  getQueue: async function() {
    const response = await this.axios.get('/queue');
    return response.data;
  },

  // setter actions
  playTrack(trackId) {
    return this.axios.get(`/spotify/now/spotify:track:${trackId}`);
  },

  playTrackNext(trackId) {
    const baseUrl = this.get('url');
    const url = `${baseUrl}/spotify/next/spotify:track:${trackId}`;
    return axios.get(url);
  },

  queueTrack: async function(zoneName, trackId, index) {
    // Sonos API is indexed at 1, that's no fun
    index++;

    // TODO: use axios transformResponse config to transform this response
    const promise = new Promise(function(resolve, reject) {

      const baseUrl = `http://localhost:5005/${zoneName}/spotify/queue/spotify:track:${trackId}`;
      const indexParam = index ? `/${index}` : '';
      const url = encodeURI(`${baseUrl}${indexParam}`);

      axios.get(url, function() {
        resolve();
      });
    });

    return promise;
  },
});
