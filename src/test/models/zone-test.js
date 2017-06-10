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
      const respond = respondSpy(ZONE_STATE);

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

const ZONE_STATE = {
    currentTrack: {
      artist: 'Rihanna',
      title: 'Kiss it Better',
      album: 'ANTI',
      albumArtUri: '/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a1XrrzhGLErbkiwH5v3xww9%3fsid%3d12%26flags%3d8224%26sn%3d10',
      duration: 120,
      uri: 'x-sonos-spotify:spotify%3atrack%3a1XrrzhGLErbkiwH5v3xww9?sid=12&flags=8224&sn=10',
      type: 'track',
      stationName: '',
      absoluteAlbumArtUri: 'http://10.10.30.252:1400/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a1XrrzhGLErbkiwH5v3xww9%3fsid%3d12%26flags%3d8224%26sn%3d10'
    },
    nextTrack: {
      artist: 'Rihanna',
      title: 'Work',
      album: 'ANTI',
      albumArtUri: '/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a4gFxywaJejXWxo0NjlWzgg%3fsid%3d12%26flags%3d8224%26sn%3d10',
      duration: 223,
      uri: 'x-sonos-spotify:spotify%3atrack%3a4gFxywaJejXWxo0NjlWzgg?sid=12&flags=8224&sn=10',
      absoluteAlbumArtUri: 'http://10.10.30.252:1400/getaa?s=1&u=x-sonos-spotify%3aspotify%253atrack%253a4gFxywaJejXWxo0NjlWzgg%3fsid%3d12%26flags%3d8224%26sn%3d10'
    },
    volume: 53,
    mute: false,
    trackNo: 1,
    elapsedTime: 45,
    elapsedTimeFormatted: '00:00:45',
    playbackState: 'PLAYING',
    playMode: {
      repeat: 'none',
      shuffle: false,
      crossfade: false
    }
  }
