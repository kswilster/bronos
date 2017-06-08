var sinon = require('sinon');
var moxios = require('moxios');
var assert = require('assert');
var Preferences = require('preferences');
var fakeTokenServer, tokenSpy;
var SpotifyApi = require('../../dist/models/spotify-api').default;

describe('spotify-api', function() {
  before(function() {
    moxios.install()
  });

  after(function() {
    moxios.uninstall()
  });

  describe('#authenticate without established preferences', function() {
    const preferences = {};
    const spotifyApi = SpotifyApi.create({
      _preferences: preferences
    });

    it('calls the token server and caches the response', function(done) {
      spotifyApi.authenticate();

      moxios.wait(function () {
        let request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: {
            body: {
              access_token: 'foo',
              expires_in: 1234,
            },
          },
        }).then(function () {
          assert.equal(spotifyApi.get('accessToken'), 'foo');
          assert.equal(preferences.tokenCache.token, 'foo');
          done();
        });
      });
    });
  });
});
