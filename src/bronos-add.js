require('babel-polyfill');

var program = require('commander');

import Utils from './utils';
import Zone from '~/models/zone';
import SpotifyApi from './models/spotify-api';

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

const app = {
  spotifyApi: null,

  run: async function(query, { type='track', index, play, next }) {
    // TODO: better error handling
    var zone, zoneName, trackIds;

    try {
      this.spotifyApi = SpotifyApi.create();
      await this.spotifyApi.authenticate();

      this.validateArgs(...arguments);
      await Utils.startSonosServer();
      const zone = await Zone.getDefaultZone();
      Utils.selectQueue(zone.serialize());

      if (type === 'artist') {
        trackIds = await this.searchByArtist(query);
      } else if (type === 'album') {
        trackIds = await this.searchByAlbum(query);
      } else {
        trackIds = await this.searchByTrack(query);
      }

      zoneName = zone.get('roomName');
      const queue = await zone.getQueue();
      index = index || queue.length + 1;

      const action = (play && 'now') || (next && 'next') || 'queue';
      zone.addTracks(trackIds, action, index);
    } catch (e) {
      console.log(e.stack);
    }
  },

  getSpotifyApi: async function() {
    const accessToken = await Utils.getSpotifyAccessToken();
    const spotifyApi = new SpotifyWebApi({ accessToken });

    // spotifyApi.setAccessToken(spotifyApi);
    return spotifyApi;
  },

  validateArgs(query, { type='track', index=0 }) {
    if (!query) {
      console.error('no query given!');
      process.exit(1);
    }

    if (!['track', 'artist', 'album'].includes(type)) {
      console.error(`invalid resource type: '${type}'. Try 'track', 'album', or 'artist'.`);
      process.exit(1);
    }

    if (index < -1) {
      console.error(`invalid queueBefore index: ${index}`);
      process.exit(1);
    }
  },

  searchByArtist: async function(query) {
    const artists = await this.spotifyApi.findArtists(query);
    const artistId = await this.chooseArtist(artists);
    const albums = await this.spotifyApi.getArtistAlbums(artistId);
    const albumId = await this.chooseAlbum(albums, { includeTopTracks: true });

    var tracks;
    if (albumId === 'TOP_TRACKS') {
      tracks = await this.spotifyApi.getArtistTopTracks(artistId);
    } else {
      tracks = await this.spotifyApi.getAlbumTracks(albumId);
    }

    return await this.chooseTracks(tracks);
  },

  searchByAlbum: async function(query) {
    const albums = await this.spotifyApi.findAlbums(query);
    const albumId = await this.chooseAlbum(albums);
    const tracks = await this.spotifyApi.getAlbumTracks(albumId);
    return await this.chooseTracks(tracks);
  },

  searchByTrack: async function(query) {
    const tracks = await this.spotifyApi.findTracks(query);
    return await this.chooseTracks(tracks);
  },

  chooseArtist: async function(artists) {
    var fzfInput = '';

    artists.forEach(function(artist, index) {
      fzfInput += `${index}: ${artist.name}\n`;
    })

    const result = await Utils.startFzf(fzfInput);
    const index = result.split(':')[0];
    const artist = artists[index];
    return artist.id;
  },

  chooseAlbum: async function(albums, {includeTopTracks=false}={}) {
    var fzfInput = '';

    if (includeTopTracks) {
      albums.unshift({
        id: 'TOP_TRACKS',
        name: 'Top Tracks'
      });
    }

    albums.forEach(function(album, index) {
      fzfInput += `${index}: ${album.name}\n`;
    })

    const result = await Utils.startFzf(fzfInput);
    const index = result.split(':')[0];
    const album = albums[index];
    return album.id;
  },

  chooseTracks: async function(tracks) {
    var fzfInput = "";

    tracks.forEach(function(track, trackIndex) {
      fzfInput += `${trackIndex}: ${track.artists[0].name}\t\t${track.name}\n`;
    });

    const result = await Utils.startFzf(fzfInput, true);
    const lines = result.split('\n');
    lines.pop();

    const chosenTrackIds = [];

    for (const line of lines) {
      const index = parseInt(line.split(':')[0]);
      const track = tracks[index];

      chosenTrackIds.push(track.id);
    }

    return chosenTrackIds;
  },
}

var queryValue;

program
  .arguments('<query...>')
  .option('-p, --play', 'queue the song(s) after the song playing and start playing immediately')
  .option('-n, --next', 'queue the song(s) after the song playing')
  .option('-i, --index [<index>]', 'queue insertion index. (default: 0) (-1 for last position)')
  .option('-t, --type [<type>]', 'type of entity to search for (artist | album | track). Defaults to track')
  .action(function(query, options) {
    queryValue = query;
    app.run(query.join(' '), options);
  })
  .parse(process.argv);

  if (typeof queryValue === 'undefined') {
     console.error('no query given!');
     process.exit(1);
  }
