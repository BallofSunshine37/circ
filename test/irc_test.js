// Generated by CoffeeScript 1.4.0
(function() {
  "use strict";

  describe('An IRC client backend', function() {
    var CURRENT_WINDOW, SERVER_WINDOW, chat, irc, resetSpies, socket, waitsForArrayBufferConversion;
    SERVER_WINDOW = window.chat.SERVER_WINDOW;
    CURRENT_WINDOW = window.chat.CURRENT_WINDOW;
    irc = socket = chat = void 0;
    waitsForArrayBufferConversion = function() {
      return waitsFor((function() {
        return !window.irc.util.isConvertingArrayBuffers();
      }), 'wait for array buffer conversion', 500);
    };
    resetSpies = function() {
      socket.connect.reset();
      socket.received.reset();
      socket.close.reset();
      chat.onConnected.reset();
      chat.onIRCMessage.reset();
      chat.onJoined.reset();
      chat.onParted.reset();
      return chat.onDisconnected.reset();
    };
    beforeEach(function() {
      jasmine.Clock.useMock();
      mocks.ChromeSocket.useMock();
      irc = new window.irc.IRC;
      socket = irc.socket;
      chat = new window.chat.MockChat(irc);
      spyOn(socket, 'connect');
      spyOn(socket, 'received').andCallThrough();
      spyOn(socket, 'close').andCallThrough();
      spyOn(chat, 'onConnected');
      spyOn(chat, 'onIRCMessage');
      spyOn(chat, 'onJoined');
      spyOn(chat, 'onParted');
      return spyOn(chat, 'onDisconnected');
    });
    it('is initially disconnected', function() {
      return expect(irc.state).toBe('disconnected');
    });
    it('does nothing on commands that require a connection when disconnected', function() {
      irc.giveup();
      irc.doCommand('NICK', 'ournick');
      irc.doCommand('JOIN', '#bash');
      irc.doCommand('WHOIS', 'ournick');
      waitsForArrayBufferConversion();
      return runs(function() {
        expect(irc.state).toBe('disconnected');
        return expect(socket.received).not.toHaveBeenCalled();
      });
    });
    describe('that is connecting with invalid username', function() {
      beforeEach(function() {
        irc.setPreferredNick('_ournick');
        irc.connect('irc.freenode.net', 6667);
        expect(irc.state).toBe('connecting');
        socket.respond('connect');
        return waitsForArrayBufferConversion();
      });
      it('strips invalid chars from USER', function() {
        return runs(function() {
          expect(socket.received.callCount).toBe(2);
          expect(socket.received.argsForCall[0]).toMatch(/NICK _ournick\s*/);
          return expect(socket.received.argsForCall[1]).toMatch(/USER ournick 0 \* :.+/);
        });
      });
    });
    return describe('that is connecting', function() {
      beforeEach(function() {
        irc.setPreferredNick('ournick');
        irc.connect('irc.freenode.net', 6667);
        expect(irc.state).toBe('connecting');
        socket.respond('connect');
        return waitsForArrayBufferConversion();
      });
      it('is connecting to the correct server and port', function() {
        return expect(socket.connect).toHaveBeenCalledWith('irc.freenode.net', 6667);
      });
      it('sends NICK and USER', function() {
        return runs(function() {
          expect(socket.received.callCount).toBe(2);
          expect(socket.received.argsForCall[0]).toMatch(/NICK ournick\s*/);
          return expect(socket.received.argsForCall[1]).toMatch(/USER ournick 0 \* :.+/);
        });
      });
      it('appends an underscore when the desired nick is in use', function() {
        socket.respondWithData(":irc.freenode.net 433 * ournick :Nickname is already in use.");
        waitsForArrayBufferConversion();
        return runs(function() {
          return expect(socket.received.mostRecentCall.args).toMatch(/NICK ournick_\s*/);
        });
      });
      return describe('then connects', function() {
        var joinChannel;
        joinChannel = function(chan, nick) {
          if (nick == null) {
            nick = 'ournick';
          }
          socket.respondWithData(":" + nick + "!ournick@company.com JOIN :" + chan);
          return waitsForArrayBufferConversion();
        };
        beforeEach(function() {
          resetSpies();
          socket.respondWithData(":cameron.freenode.net 001 ournick :Welcome");
          return waitsForArrayBufferConversion();
        });
        it("is in the 'connected' state", function() {
          return runs(function() {
            return expect(irc.state).toBe('connected');
          });
        });
        it('emits connect', function() {
          return runs(function() {
            return expect(chat.onConnected).toHaveBeenCalled();
          });
        });
        it('emits a welcome message', function() {
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith(SERVER_WINDOW, 'welcome', 'Welcome');
          });
        });
        it("parses and stores isupport response", function() {
          var cmd, data;
          socket.respondWithData(":someserver.example.com 005 ournick CHANTYPES=&#+ EXCEPTS INVEX PREFIX=(ov)@+ :are supported by this server");
          waitsForArrayBufferConversion();
          return runs(function() {
            expect(irc.support['chantypes']).toBe('&#+');
            expect(irc.support['invex']).toBe(true);
            return expect(irc.isValidChannelPrefix('+foo')).toBe(true);
          });
        });
        it("properly parses commands with parseCommand()", function() {
          var cmd, data;
          data = ":ournick!ournick@name.corp.company.com JOIN :#bash";
          cmd = irc.util.parseCommand(data);
          console.log(cmd);
          expect(cmd.command).toBe('JOIN');
          expect(cmd.params).toEqual(["#bash"]);
          expect(cmd.prefix).toBe('ournick!ournick@name.corp.company.com');
          data = ":irc.corp.company.com 324 ournick #bash +smntQ ";
          cmd = irc.util.parseCommand(data);
          expect(cmd.command).toBe('324');
          return expect(cmd.params).toEqual(['ournick', '#bash', '+smntQ']);
        });
        it("properly creates commands on doCommand()", function() {
          irc.doCommand('JOIN', '#awesome');
          irc.doCommand('PRIVMSG', '#awesome', 'hello world');
          irc.doCommand('NICK', 'ournick');
          irc.doCommand('WHOIS', 'ournick');
          irc.doCommand('PART', '#awesome', 'this channel is not awesome');
          irc.doCommand('NOTICE', 'frigg', 'SOURCE', true);
          waitsForArrayBufferConversion();
          return runs(function() {
            expect(socket.received.argsForCall[0]).toMatch(/JOIN #awesome\s*/);
            expect(socket.received.argsForCall[1]).toMatch(/PRIVMSG #awesome :hello world\s*/);
            expect(socket.received.argsForCall[2]).toMatch(/NICK ournick\s*/);
            expect(socket.received.argsForCall[3]).toMatch(/WHOIS ournick\s*/);
            expect(socket.received.argsForCall[4]).toMatch(/PART #awesome :this channel is not awesome\s*/);
            return expect(socket.received.argsForCall[5]).toMatch(/NOTICE frigg :SOURCE\s*/);
          });
        });
        it("emits 'join' after joining a room", function() {
          joinChannel('#awesome');
          return runs(function() {
            return expect(chat.onJoined).toHaveBeenCalled();
          });
        });
        it("emits a message when someone else joins a room", function() {
          joinChannel('#awesome');
          joinChannel('#awesome', 'bill');
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('#awesome', 'join', 'bill');
          });
        });
        it("responds to a PING with a PONG", function() {
          socket.respondWithData("PING :" + ((new Date()).getTime()));
          waitsForArrayBufferConversion();
          return runs(function() {
            expect(socket.received.callCount).toBe(1);
            return expect(socket.received.mostRecentCall.args).toMatch(/PONG \d+\s*/);
          });
        });
        it("sends a PING after a long period of inactivity", function() {
          jasmine.Clock.tick(80000);
          waitsForArrayBufferConversion();
          return runs(function() {
            expect(socket.received.callCount).toBe(1);
            return expect(socket.received.mostRecentCall.args).toMatch(/PING \d+\s*/);
          });
        });
        it("doesn't send a PING if regularly active", function() {
          jasmine.Clock.tick(50000);
          socket.respondWithData("PING :" + ((new Date()).getTime()));
          jasmine.Clock.tick(50000);
          irc.doCommand('JOIN', '#awesome');
          waitsForArrayBufferConversion();
          return runs(function() {
            jasmine.Clock.tick(50000);
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(socket.received.callCount).toBe(2);
            });
          });
        });
        it("can disconnected from the server on /quit", function() {
          irc.quit('this is my reason');
          waitsForArrayBufferConversion();
          return runs(function() {
            expect(socket.received.callCount).toBe(1);
            expect(socket.received.mostRecentCall.args).toMatch(/QUIT :this is my reason\s*/);
            expect(irc.state).toBe('disconnected');
            return expect(socket.close).toHaveBeenCalled();
          });
        });
        it("emits 'topic' after someone sets the topic", function() {
          joinChannel('#awesome');
          socket.respondWithData(":ournick_i!~ournick@09-stuff.company.com TOPIC #awesome :I am setting the topic!");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('#awesome', 'topic', 'ournick_i', 'I am setting the topic!');
          });
        });
        it("emits 'topic' after joining a room with a topic", function() {
          joinChannel('#awesome');
          socket.respondWithData(":freenode.net 332 ournick #awesome :I am setting the topic!");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('#awesome', 'topic', void 0, 'I am setting the topic!');
          });
        });
        it("emits 'topic' with no topic argument after receiving rpl_notopic", function() {
          joinChannel('#awesome');
          socket.respondWithData(":freenode.net 331 ournick #awesome :No topic is set.");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('#awesome', 'topic', void 0, void 0);
          });
        });
        it("emits a 'kick' message when receives KICK for someone else", function() {
          joinChannel('#awesome');
          socket.respondWithData(":jerk!user@65.93.146.49 KICK #awesome someguy :just cause");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('#awesome', 'kick', 'jerk', 'someguy', 'just cause');
          });
        });
        it("emits 'part' and a 'kick' message when receives KICK for self", function() {
          joinChannel('#awesome');
          socket.respondWithData(":jerk!user@65.93.146.49 KICK #awesome ournick :just cause");
          waitsForArrayBufferConversion();
          return runs(function() {
            expect(chat.onIRCMessage).toHaveBeenCalledWith('#awesome', 'kick', 'jerk', 'ournick', 'just cause');
            return expect(chat.onParted).toHaveBeenCalledWith('#awesome');
          });
        });
        it("emits an error notice with the given message when doing a command without privilege", function() {
          joinChannel('#awesome');
          socket.respondWithData(":freenode.net 482 ournick #awesome :You're not a channel operator");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith(CURRENT_WINDOW, 'error', "#awesome :You're not a channel operator");
          });
        });
        it("emits a mode notice when someone is given channel operator status", function() {
          joinChannel('#awesome');
          socket.respondWithData(":nice_guy!nice@guy.com MODE #awesome +o ournick");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('#awesome', 'mode', 'nice_guy', 'ournick', '+o');
          });
        });
        it("emits a nick notice to the server window when user's nick is changed", function() {
          socket.respondWithData(":ournick!user@company.com NICK :newnick");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith(SERVER_WINDOW, 'nick', 'ournick', 'newnick');
          });
        });
        it("doesn't try to set nick name to own nick name on 'nick in use' message", function() {
          var data;
          irc.doCommand('NICK', 'ournick_');
          socket.respondWithData("ournick!user@company.com NICK :ournick_");
          irc.doCommand('NICK', 'ournick');
          data = ":irc.freenode.net 433 * ournick_ ournick :Nickname is already in use.";
          socket.respondWithData(data);
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(socket.received.mostRecentCall.args).toMatch(/NICK ournick__\s*/);
          });
        });
        it("emits a privmsg notice when a private message is received", function() {
          socket.respondWithData(":someguy!user@company.com PRIVMSG #awesome :hi!");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('#awesome', 'privmsg', 'someguy', 'hi!');
          });
        });
        it("emits a privmsg notice when a direct message is received", function() {
          socket.respondWithData(":someguy!user@company.com PRIVMSG ournick :hi!");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg', 'someguy', 'hi!');
          });
        });
        it("emits a privmsg notice when a notice message is received", function() {
          socket.respondWithData(":someguy!user@company.com NOTICE ournick :hi!");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith(CURRENT_WINDOW, 'privmsg', 'someguy', 'hi!');
          });
        });
        it("emits a privmsg notice when a busy message is received", function() {
          socket.respondWithData(":server@freenode.net 301 ournick someguy :I'm busy");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg', 'someguy', "is away: I'm busy");
          });
        });
        it("emits a away notice when the user is no longer away", function() {
          socket.respondWithData(":server@freenode.net 305 ournick :Not away");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith(CURRENT_WINDOW, 'away', 'Not away');
          });
        });
        it("emits a away notice when the user is now away", function() {
          socket.respondWithData(":server@freenode.net 306 ournick :Now away");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith(CURRENT_WINDOW, 'away', 'Now away');
          });
        });
        it("emits 'notice' when the server sends a direct NOTICE", function() {
          chat.onIRCMessage.reset();
          socket.respondWithData(":server@freenode.net NOTICE * :No Ident response");
          waitsForArrayBufferConversion();
          return runs(function() {
            return expect(chat.onIRCMessage).toHaveBeenCalledWith(SERVER_WINDOW, 'notice', 'No Ident response');
          });
        });
        return describe("handles WHOIS/WHOWAS response code of", function() {
          it("311", function() {
            socket.respondWithData(":server@freenode.net 311 ournick frigg ~frigguy 127.0.0.1 * :Our User");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'is frigg!~frigguy@127.0.0.1 (Our User)');
            });
          });
          it("312", function() {
            socket.respondWithData(":server@freenode.net 312 ournick frigg freenode.net :FreeNode Network");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'connected via freenode.net (FreeNode Network)');
            });
          });
          it("313", function() {
            socket.respondWithData(":server@freenode.net 313 ournick frigg :is not an IRC Operator, but plays one on TV");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'is not an IRC Operator, but plays one on TV');
            });
          });
          it("314", function() {
            socket.respondWithData(":server@freenode.net 314 ournick frigg ~frigguy 127.0.0.1 * :Our User");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'was frigg!~frigguy@127.0.0.1 (Our User)');
            });
          });
          it("317", function() {
            var now = Math.floor(new Date().valueOf() / 1000);
            socket.respondWithData(":server@freenode.net 317 ournick frigg 101 " + now + " :seconds idle, logged in");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'has been idle for 101 seconds, and signed on at: ' + getReadableTime(now * 1000));
            });
          });
          it("318", function() {
            socket.respondWithData(":server@freenode.net 318 ournick frigg :End of WHOIS list.");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'End of WHOIS list.');
            });
          });
          it("319", function() {
            socket.respondWithData(":server@freenode.net 319 ournick frigg :#foo @#bar &baz");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'is on channels: #foo @#bar &baz');
            });
          });
          it("330", function() {
            socket.respondWithData(":server@freenode.net 330 ournick frigg FriggUser :is authenticated as");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'is authenticated as FriggUser');
            });
          });
          it("338", function() {
            socket.respondWithData(":server@freenode.net 338 ournick frigg foo@bar.com 224.1.1.1 :over the rainbow");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'is actually foo@bar.com/224.1.1.1 (over the rainbow)');
            });
          });
          it("369", function() {
            socket.respondWithData(":server@freenode.net 369 ournick frigg :End of WHOWAS list.");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'End of WHOWAS list.');
            });
          });
          it("671", function() {
            socket.respondWithData(":server@freenode.net 671 ournick frigg :is using a secure connection");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg',
                  'frigg', 'is using a secure connection');
            });
          });
        });
        return describe("has a CTCP handler which", function() {
          it("responds to CTCP VERSION with the appropriate notice message", function() {
            socket.respondWithData(":frigg PRIVMSG ournick :\u0001VERSION\u0001");
            waitsForArrayBufferConversion();
            return runs(function() {
              var versionResponse;
              versionResponse = /NOTICE\sfrigg\s:\u0001VERSION\sCIRC\s[0-9.]*\sChrome\u0001\s*/;
              return expect(socket.received.mostRecentCall.args).toMatch(versionResponse);
            });
          });
          it("responds to CTCP PING with the appropriate notice message", function() {
            socket.respondWithData(":frigg PRIVMSG ournick :\u0001PING 1234\u0001");
            waitsForArrayBufferConversion();
            return runs(function() {
              var versionResponse;
              versionResponse = /NOTICE\sfrigg\s:\u0001PING\s1234\u0001\s*/;
              return expect(socket.received.mostRecentCall.args).toMatch(versionResponse);
            });
          });
          it("responds to CTCP SOURCE with the appropriate notice message", function() {
            socket.respondWithData(":frigg PRIVMSG ournick :\u0001SOURCE\u0001");
            waitsForArrayBufferConversion();
            return runs(function() {
              var versionResponse;
              versionResponse = /NOTICE\sfrigg\s:\u0001SOURCE\u0001\s*/;
              return expect(socket.received.mostRecentCall.args).toMatch(versionResponse);
            });
          });
          return it("ignores unsupported CTCP messages", function() {
            chat.onIRCMessage.reset();
            socket.respondWithData(":frigg PRIVMSG ournick :\u0001ACTION\u0001");
            waitsForArrayBufferConversion();
            return runs(function() {
              return expect(chat.onIRCMessage).toHaveBeenCalledWith('ournick', 'privmsg', 'frigg', '\u0001ACTION\u0001');
            });
          });
        });
      });
    });
  });

}).call(this);
