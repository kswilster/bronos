import glob from 'glob';
import path from 'path';
// const pjson = require('./package.json');

const MODULES = {};

const FILE_MAP = {
  'dist/utils.js': 'Utils',
  'dist/models/zone.js': 'Zone',
  'dist/models/spotify-api.js': 'SpotifyApi',
};

function relativeRequire(file) {
  return require(path.resolve(file));
}

const Sandbox = {

  setup() {
    glob.sync('dist/{utils.js,models/**.js}').forEach(function(file) {
      const module = relativeRequire(file);
      const exportName = FILE_MAP[file];

      MODULES[file] = module.default;
      if (exportName) global[exportName] = module.default;
      global.MODULES = MODULES;
    });

    this.importDirectDeps()
  },

  importDirectDeps() {
    const depNames = this.getDependencies();
    for (const depName of depNames) {
      try {
        global[depName] = require(depName);
      } catch (e) {
        console.log(`Import Failed: ${depName}`);
      }
    }
  },

  getDependencies() {
    const pkg = relativeRequire('package.json');
    return Object.keys(pkg.dependencies);
  },

}

Sandbox.setup();
