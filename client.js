var irc=require('./lib/irc');
var sys=require('sys');
var utils=require('utils');
var colours = require("./lib/colours");

var client= new irc.Client();

client.addListener('data',function(data){
	sys.puts(data);
	
})
client.addListener('Message',function(data){
	var output=JSON.parse(data);
	var mentioned=false;
	output.message.split(/\s/).forEach(function(item){
		if (item==client.nick)
		{
			mentioned=true;
		}
	});
	if(mentioned)
	{
	sys.puts("> "+colours.green+"("+output.to+")"+colours.reset+colours.magenta+" "+output.from+colours.reset+" "+colours.bold.red+output.message+colours.reset);	
	}
	else
	{
	sys.puts("> "+colours.green+"("+output.to+")"+colours.reset+colours.magenta+" "+output.from+colours.reset+" "+output.message);	
	}
	
	
});
client.addListener('Join', function(data){
	var output=JSON.parse(data);
	sys.puts("> "+colours.blue+"(JOIN)"+colours.reset+colours.magenta+" "+output.user+" "+colours.reset+output.channel);
});
client.addListener('Quit', function(data){
	var output=JSON.parse(data);
	sys.puts("> "+colours.blue+"(QUIT)"+colours.reset+colours.magenta+" "+output.user+" "+colours.reset+output.message);
});
client.addListener('Part', function(data){
	var output=JSON.parse(data);
	sys.puts("> "+colours.blue+"(PART)"+colours.reset+colours.magenta+" "+output.user+colours.reset+" Left "+output.channel);
});
client.addListener('Notice', function(data){
	var output=JSON.parse(data);
	sys.puts("> "+colours.red+"(NOTICE)"+colours.reset+" "+output.to+" "+output.message);
});
client.addListener('Info', function(data){
	var output=JSON.parse(data);
	sys.puts("> "+colours.magenta+"(INFO) "+colours.reset+output.identifier+" "+output.message);
});
client.addListener('Active', function(data){
	sys.puts("> "+colours.magenta+"(Active) "+colours.reset+data);
});
//Input Stuff
var stdin = process.openStdin();
stdin.setEncoding('utf8');
stdin.addListener('data', function (chunk) {
		
	var match=chunk.match(/^\/([^\s]*)[\s]*(.*)/);
	if(match)
	{
		var cmd=match[1];
		var val=match[2];
		switch(cmd.toLowerCase()){
			case 'connect':
				client.connect();
				break;
			case 'nick':
				client.setNick(val);
				break;
			case 'active':
				client.setActive(val);
				break;
			case 'whois':
				client.whois(val);
				break;
			case 'join':
				client.enterChannel(val);
				client.setActive(val);
				break;
			case 'leave':
			case 'part':
				client.leaveChannel(val);
				break;
			case 'me':
				client.sendAction(val);
				break;
			case 'say':
			case 'msg':
				var twoparam=val.match(/^([^\s]*)[\s]{0,1}(.*)$/);
				if(twoparam)
				{
					sys.puts(twoparam);
					client.say(twoparam[2],twoparam[1]);
				}
				break;
			case 'raw':
				client.send(val);
				break;
			case 'exit':
				process.exit();
				client.exit();
				break;
			default:
				sys.puts('Unknown Command: '+cmd);
				break;
			
		}
	}
	else
	{
		client.say(chunk);
	}
});


