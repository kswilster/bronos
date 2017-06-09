import sinon from 'sinon';
import fauxJax from 'faux-jax';
import assert from 'assert';
import Preferences from 'preferences';
import SpotifyApi from '~/models/spotify-api';

let fakeTokenServer, tokenSpy;

describe('spotify-api', function() {
  before(function() {
    fauxJax.install();
  });

  after(function() {
    fauxJax.restore();
  });

  describe('#authenticate without established preferences', function() {
    const preferences = {};
    const spotifyApi = SpotifyApi.create({ _preferences: preferences });


    it('calls the token server and caches the response', async function() {
      const respond = sinon.spy(jsonResponse({
        body: {
          access_token: 'foo',
          expires_in: 1234,
        }
      }));
      fauxJax.on('request', respond);

      await spotifyApi.authenticate();

      assert.equal(spotifyApi.get('accessToken'), 'foo');
      assert.equal(preferences.tokenCache.token, 'foo');
      assert.ok(respond.calledOnce);
    });
  });
});

function jsonResponse(data) {
  return (request) => {
    const status = 200;
    const headers = { 'Content-Type': 'application/json' };
    request.respond(status, headers, JSON.stringify(data));
  };
}
