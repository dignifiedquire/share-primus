define(function (require, exports, module) {
  'use strict';

  var sharejs = require('sharejs');

  // Map Primus ready states to ShareJS ready states.
  var STATES = {};
  STATES[Primus.CLOSED] = 'disconnected';
  STATES[Primus.OPEN] = 'connecting';

  // Override Connection's bindToSocket method with an implementation
  // that understands Primus Stream.
  sharejs.Connection.prototype.bindToSocket = function(stream) {
    var connection = this;
    setState(stream.readyState);

    // Tiny facade so Connection can still send() messages.
    this.socket = {
      send: function(msg) {
        stream.write(msg);
      },
      close: function () {
          stream.end();
      }
    };

    stream.on('data', function(msg) {
      try {
        connection.handleMessage(msg);
      } catch (e) {
        connection.emit('error', e);
        throw e;
      }
    });

    stream.on('readyStateChange', function() {
      setState(stream.readyState);
    });

    function setState(readyState) {
      var shareState = STATES[readyState];
      if (shareState) {
        connection._setState(shareState);
      }
    }
  };
});