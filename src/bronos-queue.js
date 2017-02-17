require('babel-polyfill');

var SpotifyWebApi = require('spotify-web-api-node');
var Sonos = require('sonos');
var program = require('commander');

import Utils from './utils';

const spotifyApi = new SpotifyWebApi();

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

const app = {
  run: async function(query, { type='track' }) {
    await Utils.startSonosServer();

    if (type === 'artist') {
      this.searchByArtist(query);
    } else if (type === 'album') {
      this.searchByAlbum(query);
    } else {
      this.searchByTrack(query);
    }
  },

  _queueTracks: async function(trackIds) {
    const zone = await Utils.getCurrentZone();
    const zoneName = zone.roomName;

    trackIds.forEach(async function(trackId) {
      await Utils.queueTrack(zoneName, trackId);
    });
  },

  searchByArtist: async function(query) {
    const artists = await this.findArtists(query);
    const artistId = await this.chooseArtist(artists);
    const albums = await this.getArtistAlbums(artistId);
    const albumId = await this.chooseAlbum(albums, { includeTopTracks: true });

    var tracks;
    if (albumId === 'TOP_TRACKS') {
      tracks = await this.getArtistTopTracks(artistId);
    } else {
      tracks = await this.getAlbumTracks(albumId);
    }

    const trackIds = await this.chooseTracks(tracks);
    this._queueTracks(trackIds);
  },

  searchByAlbum: async function(query) {
    const albums = await this.findAlbums(query);
    const albumId = await this.chooseAlbum(albums);
    const tracks = await this.getAlbumTracks(albumId);
    const trackIds = await this.chooseTracks(tracks);
    this._queueTracks(trackIds);
  },

  searchByTrack: async function(query) {
    const tracks = await this.findTracks(query);
    const trackIds = await this.chooseTracks(tracks);
    this._queueTracks(trackIds);
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

    tracks.forEach(function(track, index) {
      fzfInput += `${index}: ${track.artists[0].name}\t\t${track.name}\n`;
    });

    const result = await Utils.startFzf(fzfInput, true);
    const lines = result.split('\n');
    lines.shift();
    const chosenTrackIds = [];

    for (const line in lines) {
      const index = line.split(':')[0];
      const track = tracks[index];
      chosenTrackIds.push(track.id);
    }
    return chosenTrackIds;
  },

  /**
   * lower level spotifyApi wrappers
   */
   findArtists: async function(query) {
     const { body: { artists: { items } } } = await spotifyApi.search(query, ['artist'], {
       limit: 50
     });
     return items;
   },

   findAlbums: async function(query) {
     const { body: { albums: { items } } } = await spotifyApi.search(query, ['album'], {
       limit: 50
     });
     return items;
   },

  findTracks: async function(query) {
    const { body: { tracks: { items } } } = await spotifyApi.search(query, ['track'], {
      limit: 50
    });
    return items;
  },

  getArtistAlbums: async function(artistId) {
    const { body: { items } } = await spotifyApi.getArtistAlbums(artistId);
    return items;
  },

  getArtistTopTracks: async function(artistId) {
    const { body: { tracks } } = await spotifyApi.getArtistTopTracks(artistId, 'US');
    return tracks;
  },

  getAlbumTracks: async function(albumId) {
    const { body: { items } } = await spotifyApi.getAlbumTracks(albumId);
    return items;
  }
}

var queryValue;

program
  .arguments('<query...>')
  .option('-i, --index [<index>]', 'queue insertion index')
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
