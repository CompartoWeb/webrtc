require 'rubygems'
require 'em-websocket'

EventMachine.run do
    @channels = {}
    
    EventMachine::WebSocket.start(
      :host => "0.0.0.0", :port => 8080) do |ws|     

      ws.onmessage do |msg|
        command, params = msg.split(":",2)
        if(command == "c")
          @channels[msg[2..-1]] ||= EM::Channel.new 
          @channels[msg[2..-1]].subscribe{ |msg| ws.send msg }
        else
          room, message = params.split(":",2)
          puts message.inspect
          @channels[room].push message
        end
      end  
    end
    
end