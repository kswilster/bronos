require('babel-polyfill');
import _ from 'underscore';

var sonos = require('sonos');

function handleError (err) {
  console.error('ERROR: ' + err.message)
  process.exit(1)
}

const app = {
  run() {
    this.getInitialDevice(10000, (initDevice) => {
      this.listZones(initDevice);
    })
  },

  listDevices (initDevice) {
    initDevice.getTopology(function (err, top) {
      if (err) throw err

      _.each(top.zones, function (zone) {
        console.log(zone.name)
        Object.keys(zone).forEach((key) => {
          console.log('  ' + key + ': ', zone[key])
        })
      })
    })
  },

  listZones (initDevice) {
    initDevice.getTopology(function (err, top) {
      if (err) throw err

      var zones = _.groupBy(top.zones, function (dev) {
        return dev.group
      })

      _.each(zones, function (devices, group) {
        console.log(group)
        _.each(devices, function (device) {
          console.log('  ' + device.name)
        })
      })
    })
  },

  getInitialDevice(timeoutTime, callback) {
    var search = sonos.search();
    search.once('DeviceAvailable', function (dev) {
      clearTimeout(timeout);
      search.socket.close();
      callback(dev);
    })
    var timeout = setTimeout(function () {
      search.socket.close();
      console.log('Unable to find Sonos device');
    }, timeoutTime);
  }
};

app.run();
