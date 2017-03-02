require('babel-polyfill');

var SpotifyWebApi = require('spotify-web-api-node');
var program = require('commander');

import Utils from './utils';

const spotifyApi = new SpotifyWebApi();

process.on('uncaughtException', (err) => {
  fs.writeSync(1, `Caught exception: ${err}`);
});

const app = {
  run: async function(query, { type='track', index=-1, play, next }) {
    // TODO: better error handling
    try {
      this.validateArgs(...arguments);
      await Utils.startSonosServer();
      const zone = await Utils.getCurrentZone();
      Utils.selectQueue(zone);

      const zoneName = zone.roomName;
      var trackIds = [];

      if (type === 'artist') {
        trackIds = await this.searchByArtist(query);
      } else if (type === 'album') {
        trackIds = await this.searchByAlbum(query);
      } else {
        trackIds = await this.searchByTrack(query);
      }

      const queue = await Utils.getQueue(zoneName);

      // TODO: implement multi-track playTrack and playTrackNext
      if (play) {
        Utils.playTrack(zoneName, trackIds[0]);
      } else if (next) {
        Utils.playTrackNext(zoneName, trackIds[0]);
      } else {
        this._queueTrack(zoneName, trackIds[0], index, queue.length);
      }
    } catch (e) {
      console.error('Error in bronos-add#run');
      console.error(e.stack);
    }
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

  _queueTrack: async function(zoneName, trackId, index=-1, queueLength) {
    if (index === -1) {
      index = queueLength;
    }

    Utils.queueTrack(zoneName, trackId, index);
  },

  _queueTracks: async function(zoneName, trackIds, index=-1, queueLength) {
    if (index === -1) {
      index = queueLength;
    }

    // TODO: implement addMultipleURIsToQueue and stop sending all these requests
    // to queue multiple songs
    // NOTE: avoid using _queueTracks for now because this is awful
    trackIds.forEach(async function(trackId) {
      console.log(`queueTracks ${zoneName} ${trackIds} ${index} ${queueLength}`);
      await Utils.queueTrack(zoneName, trackId, index);
      index++;
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

    return await this.chooseTracks(tracks);
  },

  searchByAlbum: async function(query) {
    const albums = await this.findAlbums(query);
    const albumId = await this.chooseAlbum(albums);
    const tracks = await this.getAlbumTracks(albumId);
    return await this.chooseTracks(tracks);
  },

  searchByTrack: async function(query) {
    const tracks = await this.findTracks(query);
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
