require('babel-polyfill');

var SpotifyWebApi = require('spotify-web-api-node');
var Sonos = require('sonos');
var program = require('commander');
var spawn = require('child_process').spawn;

const spotifyApi = new SpotifyWebApi();

const app = {
  run(query, { type='track' }) {
    if (type === 'artist') {
      this.searchByArtist(query);
    } else if (type === 'album') {
      this.searchByAlbum(query);
    } else {
      this.searchByTrack(query);
    }
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

    const trackId = await this.chooseTrack(tracks);
    console.log(trackId);
  },

  searchByAlbum: async function(query) {
    const albums = await this.findAlbums(query);
    const albumId = await this.chooseAlbum(albums);
    const tracks = await this.getAlbumTracks(albumId);
    const trackId = await this.chooseTrack(tracks);
    console.log(trackId);
  },

  searchByTrack: async function(query) {
    const tracks = await this.findTracks(query);
    const trackId = await this.chooseTrack(tracks);
    console.log(trackId);
  },

  chooseArtist: async function(artists) {
    var fzfInput = '';

    artists.forEach(function(artist, index) {
      fzfInput += `${index}: ${artist.name}\n`;
    })

    const result = await this.startFzf(fzfInput);
    const index = result.split(':')[0];
    const artist = artists[index];
    return artist.id;
  },

  chooseAlbum: async function(albums, { includeTopTracks=false }) {
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

    const result = await this.startFzf(fzfInput);
    const index = result.split(':')[0];
    const album = albums[index];
    return album.id;
  },

  chooseTrack: async function(tracks) {
    var fzfInput = "";

    tracks.forEach(function(track, index) {
      fzfInput += `${index}: ${track.artists[0].name}\t\t${track.name}\n`;
    });

    const result = await this.startFzf(fzfInput);
    const index = result.split(':')[0];
    const track = tracks[index];
    return track.id;
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
  },

  startFzf: async function(entries) {
    const fzf = spawn(`echo "${entries}" | fzf`, {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });

    fzf.stdout.setEncoding('utf-8');

    const promise = new Promise(function(resolve, reject) {
      fzf.stdout.on('readable', () => {
        const value = fzf.stdout.read();
        if (value !== null) {
          resolve(value);
        }
      });
    });

    return promise;
  }
}

// TODO: handle insert at index

program
  .arguments('<query...>')
  .option('-i, --index [<index>]', 'queue insertion index')
  .option('-t, --type [<type>]', 'type of entity to search for (artist | album | track). Defaults to track')
  .action(function(query, options) {
    app.run(query.join(' '), options);
  })
  .parse(process.argv);
