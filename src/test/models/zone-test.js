import sinon from 'sinon';
import fauxJax from 'faux-jax';
import assert from 'assert';
import Zone from '~/models/zone';

describe('zone', function() {
  before(function() {
    fauxJax.install();
  });

  after(function() {
    fauxJax.restore();
  });

  afterEach(function() {
    fauxJax.removeAllListeners('request');
  });

  describe('#fetch without roomName', function() {
    const zone = Zone.create({ });

    it('throws an error', function() {
      asyncThrows(zone.fetch);
    });
  });

  describe('#fetch with roomName', function() {
    it('fetches zone status', async function() {
      const zone = Zone.create({ roomName: 'Living Room' });
      const respond = respondSpy(ZONE_RESPONSE);

      await zone.fetch();
      assert.ok(respond.calledOnce);
      assert.equal(zone.get('state').currentTrack.artist, 'Rihanna');
    });
  });
});

function respondSpy(response) {
  const status = 200;
  const headers = { 'Content-Type': 'application/json' };
  const respond = sinon.spy((request) => {
    request.respond(status, headers, JSON.stringify(response));
  });
  fauxJax.once('request', respond);
  return respond;
}

async function asyncThrows(fn) {
  var error;
  try {
    await fn();
  } catch(e) {
    error = e;
  }

  assert.throws(function() {
    throw error;
  })
}

const ZONE_RESPONSE = [{
	"uuid": "RINCON_B8E937E8EE5201400",
	"coordinator": {
		"uuid": "RINCON_B8E937E8EE5201400",
		"state": {
			"volume": 48,
			"mute": false,
			"equalizer": {
				"bass": 0,
				"treble": 0,
				"loudness": true
			},
			"currentTrack": {
				"artist": "ScHoolboy Q",
				"title": "THat Part",
				"album": "Blank Face LP",
				"albumArtUri": "/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a2yJ9GVCLMmzBBfQAnfzlwr%3fsid%3d12%26flags%3d8224%26sn%3d10",
				"duration": 313,
				"uri": "x-sonos-spotify:spotify%3atrack%3a2yJ9GVCLMmzBBfQAnfzlwr?sid=12&flags=8224&sn=10",
				"type": "track",
				"stationName": "",
				"absoluteAlbumArtUri": "http://10.0.0.244:1400/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a2yJ9GVCLMmzBBfQAnfzlwr%3fsid%3d12%26flags%3d8224%26sn%3d10"
			},
			"nextTrack": {
				"artist": "Death Grips",
				"title": "World Of Dogs",
				"album": "No Love Deep Web",
				"albumArtUri": "/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a1vsdF31uQBAxLTXIUAke6T%3fsid%3d12%26flags%3d8224%26sn%3d10",
				"duration": 162,
				"uri": "x-sonos-spotify:spotify%3atrack%3a1vsdF31uQBAxLTXIUAke6T?sid=12&flags=8224&sn=10",
				"absoluteAlbumArtUri": "http://10.0.0.244:1400/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a1vsdF31uQBAxLTXIUAke6T%3fsid%3d12%26flags%3d8224%26sn%3d10"
			},
			"trackNo": 8,
			"elapsedTime": 26,
			"elapsedTimeFormatted": "00:00:26",
			"playbackState": "STOPPED",
			"playMode": {
				"repeat": "none",
				"shuffle": false,
				"crossfade": false
			}
		},
		"roomName": "MMXXIVXY",
		"coordinator": "RINCON_B8E937E8EE5201400",
		"groupState": {
			"volume": 48,
			"mute": false
		}
	},
	"members": [{
		"uuid": "RINCON_B8E937E8EE5201400",
		"state": {
			"volume": 48,
			"mute": false,
			"equalizer": {
				"bass": 0,
				"treble": 0,
				"loudness": true
			},
			"currentTrack": {
				"artist": "ScHoolboy Q",
				"title": "THat Part",
				"album": "Blank Face LP",
				"albumArtUri": "/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a2yJ9GVCLMmzBBfQAnfzlwr%3fsid%3d12%26flags%3d8224%26sn%3d10",
				"duration": 313,
				"uri": "x-sonos-spotify:spotify%3atrack%3a2yJ9GVCLMmzBBfQAnfzlwr?sid=12&flags=8224&sn=10",
				"type": "track",
				"stationName": "",
				"absoluteAlbumArtUri": "http://10.0.0.244:1400/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a2yJ9GVCLMmzBBfQAnfzlwr%3fsid%3d12%26flags%3d8224%26sn%3d10"
			},
			"nextTrack": {
				"artist": "Death Grips",
				"title": "World Of Dogs",
				"album": "No Love Deep Web",
				"albumArtUri": "/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a1vsdF31uQBAxLTXIUAke6T%3fsid%3d12%26flags%3d8224%26sn%3d10",
				"duration": 162,
				"uri": "x-sonos-spotify:spotify%3atrack%3a1vsdF31uQBAxLTXIUAke6T?sid=12&flags=8224&sn=10",
				"absoluteAlbumArtUri": "http://10.0.0.244:1400/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a1vsdF31uQBAxLTXIUAke6T%3fsid%3d12%26flags%3d8224%26sn%3d10"
			},
			"trackNo": 8,
			"elapsedTime": 26,
			"elapsedTimeFormatted": "00:00:26",
			"playbackState": "STOPPED",
			"playMode": {
				"repeat": "none",
				"shuffle": false,
				"crossfade": false
			}
		},
		"roomName": "MMXXIVXY",
		"coordinator": "RINCON_B8E937E8EE5201400",
		"groupState": {
			"volume": 48,
			"mute": false
		}
	}]
}];
