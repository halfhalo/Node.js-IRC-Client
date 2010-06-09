var http = require('http'), 
		url = require('url'),
		fs = require('fs'),
		io = require('./lib/socket/lib/socket.io'),
		sys = require('sys'),
		irc=require('./lib/irc/irc');
send404 = function(res){
	res.writeHead(404);
	res.write('404');
	res.end();
},
		
server = http.createServer(function(req, res){
	// your normal server code
	var path = url.parse(req.url).pathname;
	switch (path){
		case '/':
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('<h1>Welcome. Try the <a href="/client.html">chat</a> example.</h1>');
			res.end();
			break;
			
		default:
			if (/\.(js|html|swf|css)$/.test(path)){
				try {
					var swf = path.substr(-4) === '.swf';
					res.writeHead(200, {'Content-Type': swf ? 'application/x-shockwave-flash' : ('text/' + (path.substr(-3) === '.js' ? 'javascript' : 'html'))});
					res.write(fs.readFileSync(__dirname + path, swf ? 'binary' : 'utf8'), swf ? 'binary' : 'utf8');
					res.end();
				} catch(e){ 
					send404(res); 
				}				
				break;
			}
		
			send404(res);
			break;
	}
});

server.listen(85);
io.listen(server, {
	onClientConnect: function(client){
		client.irc=new irc.Client();
client.irc.connect();
		client.irc.addListener('Data',function(data){
			var output={
				'type':'Data',
				'content':data
			}
			client.send(JSON.stringify(output));
		})
	},
	onClientDisconnect: function(client){
		client.irc.exit();
		sys.puts('Disconnected Client!');
	},
	onClientMessage: function(message, client){
		var obj=JSON.parse(message);
		switch(obj.type){
			case 'PING':
				var output={
					'type':'PING'
				}
			//	sys.puts(client.sessionId+' Sent PING');
				client.send(JSON.stringify(output));
				break;
			case 'Data':
				sys.puts("Got: "+message)
				client.irc.input(obj.content);
				break;
			case 'CONNECT':
					
				break;
			case 'DISCONNECT':
				break;
			default:
				break;
		}
		
		
	}	
});
