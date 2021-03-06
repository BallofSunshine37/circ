// Generated by CoffeeScript 1.4.0
(function() {
  "use strict";
  var DeveloperCommands, exports, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  var exports = (_ref = window.chat) != null ? _ref : window.chat = {};

  /*
   * Special commands used to make testing easier. These commands are not
   * displayed in /help.
  */


  DeveloperCommands = (function(_super) {

    __extends(DeveloperCommands, _super);

    function DeveloperCommands(_chat) {
      this._chat = _chat;
      DeveloperCommands.__super__.constructor.apply(this, arguments);
    }

    DeveloperCommands.prototype._handlers = {
      'test-notif': function() {
        return new chat.Notification('test', 'hi!').show();
      },
      'test-upgrade-prompt': function() {
        this._chat._promptToUpdate();
      },
      'get-pw': function() {
        return this._chat.displayMessage('notice', this.params[0].context, 'Your password is: ' + this._chat.remoteConnection._password);
      },
      'set-pw': function(event) {
        var password, _ref1;
        password = (_ref1 = event.args[0]) != null ? _ref1 : 'bacon';
        this._chat.storage._store('password', password);
        return this._chat.setPassword(password);
      }
    };

    DeveloperCommands.prototype._handleCommand = function(command, text) {
      var _ref1;
      if (text == null) {
        text = '';
      }
      return (_ref1 = this._chat.userCommands).handle.apply(_ref1, [command, this.params[0]].concat(__slice.call(text.split(' '))));
    };

    return DeveloperCommands;

  })(MessageHandler);

  exports.DeveloperCommands = DeveloperCommands;

}).call(this);
