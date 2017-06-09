import sinon from 'sinon';
import fauxJax from 'faux-jax';
import assert from 'assert';
import Preferences from 'preferences';
import SpotifyApi from '~/models/spotify-api';

let clock, globalSpy;

before(function() {
  fauxJax.install();
  clock = sinon.useFakeTimers(100000);
});

after(function() {
  fauxJax.restore();
  clock.restore();
});

afterEach(function() {
  fauxJax.removeAllListeners('request');
});

describe('spotify-api', function() {

  describe('#authenticate without established preferences', function() {
    const preferences = {};
    const spotifyApi = SpotifyApi.create({ preferences });

    it('fetches a token and caches the response', async function() {
      // token time to live in seconds
      const token = 'fresh-new-token';
      const tokenTTL = 1;
      const expectedExpiration = tokenTTL * 1000 + Date.now();
      const respond = respondSpy({
        body: {
          access_token: token,
          expires_in: tokenTTL,
        }
      });

      await spotifyApi.authenticate();

      assert.deepEqual(preferences.tokenCache, {
        token,
        expiration: expectedExpiration,
      });
      assert.ok(respond.calledOnce);
    });
  });

  describe('#authenticate with valid, cached token', function() {
    const preferences = {
      tokenCache: {
        token: 'cached-token',
        expiration: Date.now() + 10000,
      },
    };
    const spotifyApi = SpotifyApi.create({ preferences });

    it('uses existing token', async function() {
      const respond = respondSpy();
      await spotifyApi.authenticate();

      assert.equal(respond.callCount, 0, 'spotifyApi requested token');
    });
  });

  describe('#authenticate with old, cached token', function() {
    let spotifyApi, expectedPreferences, respond;

    before(function() {
      const token = 'fresh-new-token';
      // token time to live in seconds
      const tokenTTL = 1;

      spotifyApi = SpotifyApi.create({
        preferences: {
          tokenCache: {
            token: 'old-cached-token',
            expiration: Date.now(),
          },
        },
      });

      // travel 2 second into the future
      clock.tick(2000);

      expectedPreferences = {
        tokenCache: {
          token,
          expiration: tokenTTL * 1000 + Date.now(),
        },
      };

      respond = respondSpy({
        body: {
          access_token: token,
          expires_in: tokenTTL,
        }
      });
    });

    it('fetches a token and caches the response', async function() {
      await spotifyApi.authenticate();

      assert.deepEqual(spotifyApi.get('preferences'), expectedPreferences);
      assert.equal(respond.callCount, 1);
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
