var SpotifyWebApi = require('spotify-web-api-node');
var Sonos = require('sonos');
var program = require('commander');
var spawn = require('child_process').spawn;

// process.stdin.on('readable', () => {
//   var chunk = process.stdin.read();
//   if (chunk !== null) {
//     console.log(`data: ${chunk}`);
//     process.stdout.write(`data: ${chunk}`);
//   }
// });

const app = {
  run: async function(searchTerm) {
    const spotifyApi = new SpotifyWebApi();
    const { body: { tracks: { items } } } = await spotifyApi.searchTracks(searchTerm);

    var fzfInput = "";
    var log = "";

    for (const track of items) {
      fzfInput += `${track.artists[0].name}\t\t${track.name}\n`;
    }

    const child = spawn(`echo "${fzfInput}" | fzf`, {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });

    child.stdout.setEncoding('utf-8');
    child.stdout.on('readable', () => {
      const value = child.stdout.read();
      console.log('readable: ' + value);
    });

    child.on('close', () => {
      console.log('fzf closed');
    });
  }
}

program
  .arguments('<searchTerm>')
  .action(function(searchTerm) {
    app.run(searchTerm);
  })
  .parse(process.argv);
