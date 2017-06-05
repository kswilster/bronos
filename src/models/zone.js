require('babel-polyfill');

import assert from 'assert';
import axios from 'axios';
import emberMetal from 'ember-metal';
import emberRuntime from 'ember-runtime';
import Utils from '../utils';
import path from 'path';

const { fork } = require('child_process');

export default Ember.Object.extend({
  // base url for most actions
  baseURL: function() {
    const roomName = this.get('roomName');
    return `http://localhost:5005/${roomName}/`;
  }.property('roomName'),

  // TODO: override axios url to encodeURI
  axios: function() {
    const baseURL = this.get('baseURL');
    const axiosInstance = axios.create({ baseURL });
    return axiosInstance;
  }.property('baseURL'),

  // lifecycle hooks
  init() {
    const roomName = this.get('roomName');
    // Zones require a roomName
    assert.ok(typeof roomName === 'string', 'Zone requires a roomName');
  },

  // getter actions
  fetch: async function() {
    const roomName = this.get('roomName');
    const url = `http://localhost:5005/${roomName}/state`;
    const response = await axios.get(url);
    this.set('state', response.data);
  },

  getQueue: async function() {
    const axios = this.get('axios');
    const response = await axios.get('/queue');
    return response.data;
  },

  // setter actions
  playTrack(trackId) {
    return this.get('axios').get(`/spotify/now/spotify:track:${trackId}`);
  },

  playTrackNext(trackId) {
    return this.get('axios').get(`/spotify/next/spotify:track:${trackId}`);
  },

  next() {
    const axios = this.get('axios');
    const roomName = this.get('roomName');
    const url = encodeURI(`http://localhost:5005/${roomName}/next`);
    return axios.get(url);
  },

  previous: async function() {
    const axios = this.get('axios');
    const roomName = this.get('roomName');
    const url = encodeURI(`http://localhost:5005/${roomName}/previous`);
    return axios.get(url);
  },

  play: async function() {
    const axios = this.get('axios');
    const roomName = this.get('roomName');
    const url = encodeURI(`http://localhost:5005/${roomName}/play`);
    return axios.get(url);
  },

  pause: async function() {
    const axios = this.get('axios');
    const roomName = this.get('roomName');
    const url = encodeURI(`http://localhost:5005/${roomName}/pause`);
    return axios.get(url);
  },

  say: async function(message) {
    const axios = this.get('axios');
    const roomName = this.get('roomName');
    const url = encodeURI(`http://localhost:5005/${roomName}/say/${message}`);
    this.backgroundMethod('axiosGet', url);
  },

  axiosGet(url) {
    return this.get('axios').get(url);
  },

  queueTrack: async function(zoneName, trackId, index) {
    // Sonos API is indexed at 1, that's no fun
    index++;

    // TODO: use axios transformResponse config to transform this response
    const promise = new Promise(function(resolve, reject) {

      const baseURL = `http://localhost:5005/${zoneName}/spotify/queue/spotify:track:${trackId}`;
      const indexParam = index ? `/${index}` : '';
      const url = encodeURI(`${baseURL}${indexParam}`);

      axios.get(url, function() {
        resolve();
      });
    });

    return promise;
  },

  // TODO: extract this into base model
  backgroundMethod(methodName, ...args) {
    const modelName = 'zone';
    const scriptPath = path.normalize(`${__dirname}/background.js`);
    const child = fork(scriptPath);
    const data = this.serialize();

    child.send({ modelName, methodName, args, data });
    child.disconnect();
    process.exit();
  },

  serialize() {
    return this.getProperties('roomName', 'state');
  },
});
