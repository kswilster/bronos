require('babel-polyfill');

import axios from 'axios';
import emberMetal from 'ember-metal';
import emberRuntime from 'ember-runtime';
import Preferences from 'preferences';
import SpotifyWebApi from 'spotify-web-api-node';

const APP_ID = 'com.lintcondition.bronos';
const SPOTIFY_ACCESS_TOKEN_URL = 'https://oka1hz3dtb.execute-api.us-east-1.amazonaws.com/prod/spotifyAccessToken';

axios.interceptors.response.use(function (response) {
  // Do something with response data
  return response;
}, function (error) {
  // Do something with response error
  console.log(error.config.url);
  return Promise.reject(error.url);
});

export default Ember.Object.extend({

  spotifyAccessTokenUrl: SPOTIFY_ACCESS_TOKEN_URL,

  requestOptions: {
    limit: 50,
  },

  async authenticate() {
    const accessToken = this._getCachedToken() || await this._fetchTokenAndCache();
    this.set('accessToken', accessToken);
    this.set('__api', new SpotifyWebApi({ accessToken }));
  },

  // SpotifyWebApi helper methods
   async findArtists(query) {
     const api = this.get('_api');
     const requestOptions = this.get('requestOptions');
     const { body: { artists: { items } } } = await api.search(query, ['artist'], requestOptions);
     return items;
   },

   async findAlbums(query) {
     const api = this.get('_api');
     const requestOptions = this.get('requestOptions');
     const { body: { albums: { items } } } = await api.search(query, ['album'], requestOptions);
     return items;
   },

  async findTracks(query) {
    const api = this.get('_api');
    const requestOptions = this.get('requestOptions');
    const { body: { tracks: { items } } } = await api.search(query, ['track'], requestOptions);
    return items;
  },

  async getArtistAlbums(artistId) {
    const api = this.get('_api');
    const { body: { items } } = await api.getArtistAlbums(artistId);
    return items;
  },

  async getArtistTopTracks(artistId) {
    const api = this.get('_api');
    const { body: { tracks } } = await api.getArtistTopTracks(artistId, 'US');
    return tracks;
  },

  async getAlbumTracks(albumId) {
    const api = this.get('_api');
    const { body: { items } } = await api.getAlbumTracks(albumId);
    return items;
  },

  // private
  _api: function() {
    const __api = this.get('__api');
    if (__api) {
      return __api;
    } else {
      throw new Error('SpotifyApi must be authenticated before use');
    }
  }.property(),

  __api: null,

  preferences: function() {
    return new Preferences(APP_ID, {});
  }.property(),

  async _fetchTokenAndCache() {
    const spotifyAccessTokenUrl = this.get('spotifyAccessTokenUrl');
    const response = await axios.get(spotifyAccessTokenUrl);
    const token = response.data.body['access_token'];
    const expiresIn = response.data.body['expires_in'];

    this._cacheToken(token, expiresIn);
    return token;
  },

  // cache the token with an expiration timestamp.
  _cacheToken(token, expiresIn) {
    const preferences = this.get('preferences');
    const currentTime = Date.now();
    const timeToLive = expiresIn * 1000;
    const expiration = currentTime + timeToLive;

    preferences.tokenCache = { token, expiration };
  },

  // because we might retrieve the token and perform some other
  // async behavior before using it
  // the cutoff is to ensure we never use expired tokens
  _getCachedToken() {
    const cutoff = 5000;
    const preferences = this.get('preferences');
    const { token, expiration } = preferences.tokenCache || {};
    const currentTime = Date.now();

    if (currentTime > expiration - cutoff) {
      return;
    } else {
      return token;
    }
  },
});
