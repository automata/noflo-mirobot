noflo = require 'noflo'

sleep = (ms) ->
  start = new Date().getTime()
  continue while new Date().getTime() - start < ms

class SendCommand extends noflo.Component
  description: 'Sends a command to Mirobot.'
  icon: 'pencil'

  constructor: ->
    # Default Mirobot's websocket URI
    @url = 'ws://10.10.100.254:8899/websocket'
    @Mirobot = null
    @mirobot = null

    @inPorts =
      lib: new noflo.Port 'object'
      url: new noflo.Port 'string'
      disconnect: new noflo.Port 'bang'
      command: new noflo.Port 'object'

    @outPorts =
      completed: new noflo.Port 'string'
      connected: new noflo.Port 'string'
      disconnected: new noflo.Port 'string'

    @inPorts.lib.on 'data', (data) =>
      @Mirobot = data

    @inPorts.url.on 'data', (data) =>
      @url = data
      if not @mirobot?
        @mirobot = new @Mirobot @url, () =>
          return unless @outPorts.connected.isAttached()
          @outPorts.connected.send 'connected'

    @inPorts.disconnect.on 'data', (data) =>
      if @mirobot?
        @mirobot.stop (state, msg, recursion) =>
          @outPorts.disconnected.send 'disconnected'
          @mirobot = null

    @inPorts.command.on 'data', (data) =>
      if @mirobot?
        @parseThing data

  shutdown: =>
    if @mirobot?
      @mirobot.stop()
      @mirobot = null

  parseThing: (thing) ->
    console.log 'Receive', thing
    if thing? and thing.cmd? and @[thing.cmd]?
      @[thing.cmd](thing)
    else if thing instanceof Array
      for item in thing
        continue unless item?
        @parseThing item

  forward: (distance, currentPoint) =>
    @setIcon 'arrow-up'
    @mirobot.move 'forward', distance.arg, (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

  back: (distance, currentPoint) =>
    @setIcon 'arrow-down'
    @mirobot.move 'back', distance.arg, (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

  left: (angle, currentPoint) =>
    @setIcon 'mail-reply'
    @mirobot.turn 'left', angle.arg, (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

  right: (angle, currentPoint) =>
    @setIcon 'mail-forward'
    @mirobot.turn 'right', angle.arg, (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

  pause: ->
    @mirobot.pause (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

  resume: ->
    @mirobot.resume (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

  ping: ->
    @mirobot.ping (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

  penup: ->
    @mirobot.penup (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

  pendown: ->
    @mirobot.pendown (state, msg, recursion) =>
      if state is 'complete'
        @outPorts.completed.send state

exports.getComponent = -> new SendCommand
