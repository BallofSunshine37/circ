(function() {
  "use strict";
  var SslSocket, exports, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
    
  var exports = (_ref = window.net) !== null ? _ref : window.net = {};
  
  SslSocket = (function(_super) {
    
    __extends(SslSocket, _super);

    function SslSocket() {
      this._onConnect = __bind(this._onConnect, this);
      this._onSslConnect = __bind(this._onSslConnect, this);
      return SslSocket.__super__.constructor.apply(this, arguments);
    }

    SslSocket.prototype._onConnect = function(rc) {
      if (rc < 0) {
        return this.emit('error', "couldn't connect to socket: " +
          chrome.runtime.lastError.message + " (error " + (-rc) + ")");
      } else {
        chrome.sockets.tcp.secure(this.socketId, {}, this._onSslConnect);
      }
    };
    
    SslSocket.prototype._onSslConnect = function(rc) {
      if (rc < 0) {
        return this.emit('error', "couldn't start SSL/TLS: " +
          chrome.runtime.lastError.message + " (error " + (-rc) + ")");
      } else {
        this.emit('connect');

        chrome.sockets.tcp.onReceive.addListener(this._onReceive);
        chrome.sockets.tcp.onReceiveError.addListener(this._onReceiveError);
        chrome.sockets.tcp.setPaused(this.socketId, false);
      }
    };
    
    return SslSocket;

  })(net.ChromeSocket);
  
  exports.SslSocket = SslSocket;

}).call(this);