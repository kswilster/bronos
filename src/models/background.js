require('babel-polyfill');
import Utils from '~/utils';
import assert from 'assert';

const worker = {
  run: async function() {
    // keep alive for a second waiting for message
    const timeout = Utils.sleep(1000);

    const execPromise = new Promise(function(resolve) {
      process.on('message', ({ modelName, methodName, args, data }) => {
        // TODO: validate existence of model, method, etc;
        try {
          const Model = require(`./${modelName}`).default;
          const modelInstance = Model.create(data);
          modelInstance[methodName](...args);
        } catch(e) {
          console.log(e.stack);
        }

        resolve();
      });
    });

    await Promise.race([timeout, execPromise]);
  },
}

worker.run();
