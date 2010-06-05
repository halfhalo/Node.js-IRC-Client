var sys = require('sys');
var net = require('net');
var irc = exports;
//Bind Function
function bind(fn, scope) {
  var bindArgs = Array.prototype.slice.call(arguments);
  bindArgs.shift();
  bindArgs.shift();

  return function() {
    var args = Array.prototype.slice.call(arguments);
    fn.apply(scope, bindArgs.concat(args));
  };
}
//Set up Client
var Client=irc.Client=function(host,port)
{
	this.host = host || 'irc.freenode.net';
	this.port = port || 6667;
	this.connection = null;
	this.connected=false;
	this.buffer='';
	this.encoding='utf8';
	this.timeout = 10*60*60*1000;
	this.nick=null;
	this.user=null;
	this.real=null;
	this.active='';
	this.channels=[];
}

sys.inherits(Client, process.EventEmitter);
Client.prototype.connect=function(){
	var connection=net.createConnection(this.port,this.host);
	connection.setEncoding(this.encoding);
	connection.setTimeout(this.timeout);
	connection.addListener('connect', bind(this.on_Connect, this));
	connection.addListener('data', bind(this.on_Data, this));
	connection.setKeepAlive(enable=true,10000);
	this.nick = this.nick || "nodejs-guest";
	this.user = this.user || 'nodejs';
	this.real = this.real || 'Nodie';
	this.connection=connection;
}
Client.prototype.on_Connect = function() {
  	this.send('NICK', this.nick);
  	this.send('USER', this.user, '0', '*', ':'+this.real);
	this.connected=true;
};
Client.prototype.sendAction=function(msg,channel){
	var to=channel || this.active;
	var output={
		"to":to,
		"from":this.nick,
		"message":msg
	};
	this.raw("PRIVMSG "+to+" :\x01ACTION "+msg+"\x01"+"\r\n");
	this.emit('Message',JSON.stringify(output));
}
Client.prototype.setNick=function(nick){
	if(nick)
	{
		this.nick=nick;
		if(this.connected){
			this.send('NICK', this.nick);
		}

	}
	else
	{
		this.emits("ERROR","Nick Cannot be null");
	}
}

Client.prototype.connectionStatus=function(update){
	this.emit('Status',this.connection);
};

Client.prototype.enterChannel=function(channel){
	this.send('JOIN',channel);
};
Client.prototype.leaveChannel=function(channel){
	this.send('PART',channel);
};

Client.prototype.say=function(msg,channel){
	var to=channel || this.active;
	var output={
		"to":to,
		"from":this.nick,
		"message":msg
	};
	this.emit('Message',JSON.stringify(output));
	this.send('PRIVMSG',to,":"+msg);
};

Client.prototype.setActive=function(channel){
	this.active=channel;
	this.emit('Active',this.active);
};
Client.prototype.on_Data=function(data){
	this.buffer=this.buffer+data;
	
	while (this.buffer) {
	    var offset = this.buffer.indexOf("\r\n");
	    if (offset < 0) {
	     return;
	}

		var message = this.buffer.substr(0, offset);
		this.buffer = this.buffer.substr(offset + 2);

		if(data.match(/(?:(:[^\s]+) )?([^\s]+) (.+)/))
		{
			matchs=message.match(/(?:(:[^\s]+) )?([^\s]+) (.+)/);
			if(matchs[1])
			{
				user=matchs[1].match(/:([^!]+)!/);	
			}
			if(matchs[2])
			{
				var params = matchs[3].match(/(.*?) ?:(.*)/);
				switch(matchs[2]){
					default:
					var msg='';
						if(params)
						{
							msg=params[2] || matchs[3];
						}
						else
						{
							msg=matchs[3];
						}
						var output={
							'identifier':matchs[2],
							'message':msg
						}
						this.emit('Info',JSON.stringify(output));
					
						break;
					case 'PRIVMSG':
						var output={
							"to":params[1],
							"from":user[1],
							"message":params[2]
						};
						this.emit('Message',JSON.stringify(output));
						break;
					case 'NOTICE':
						if(params)
						{
							var output={
								'to': params[1],
								'message':params[2]
							}
							this.emit('Notice',JSON.stringify(output));
						}
						break;
					case 'MODE':
						if(params)
						{
							var output={
								'user':params[1],
								'mode':params[2]
							}
						this.emit('Mode',JSON.stringify(output));	
						}

						break;
					case 'JOIN':
						if(params)
						{
							var output={
								"user":user[1],
								"channel":params[2]
							};
							this.emit('Join',JSON.stringify(output));	
						}
						break;
					case 'QUIT':
						if(params)
						{
							var output={
								"user":user[1],
								"message":params[2]
							};
							this.emit('Quit',JSON.stringify(output));
						}
						break;
					case 'PART':
						if(params)
						{
							var output={
								"user":user[1],
								"channel":params[2]
							};
							this.emit('Part',JSON.stringify(output));
						}
						break;
					case 'PING':
						this.send('PONG');
						break;
					
				}

			}
			else
			{
				sys.puts(data);
			}
		}
		else
		{
			sys.puts(data);
		}
	}
}

Client.prototype.exit=function(){
	if(this.connected)
	{
	this.connection.end();		
	}

};
Client.prototype.whois=function(user){
	this.send('WHOIS',user);	
};
Client.prototype.raw=function(command){
	this.connection.write(command);
};
Client.prototype.send = function(arg1) {
  if (this.connection.readyState !== 'open') {
   sys.puts("Unable to Send");
  }

  var message = [];
  for (var i = 0; i< arguments.length; i++) {
    if (arguments[i]) {
      message.push(arguments[i]);
    }
  }
  message = message.join(' ');

  //sys.puts('> '+message);
  message = message + "\r\n";
  this.connection.write(message, this.encoding);
};