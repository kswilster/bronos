var SpotifyWebApi = require('spotify-web-api-node');
var Sonos = require('sonos');
var program = require('commander');
var spawn = require('child_process').spawn;

const app = {
  run: async function(searchTerm) {
    const spotifyApi = new SpotifyWebApi();
    const { body: { tracks: { items } } } = await spotifyApi.searchTracks(searchTerm);

    var fzfInput = "";
    var log = "";

    items.forEach(function(track, index) {
      fzfInput += `${index}: ${track.artists[0].name}\t\t${track.name}\n`;
    });

    const result = await this.startFzf(fzfInput);
    const index = result.split(':')[0];
    const track = items[index];
    console.log(track.id);
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

program
  .arguments('<searchTerm>')
  .action(function(searchTerm) {
    app.run(searchTerm);
  })
  .parse(process.argv);
