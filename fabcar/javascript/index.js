let express = require('express')
let app = express();

let http = require('http');
let server = http.Server(app);

let socketIO = require('socket.io');
let io = socketIO(server);

const port = process.env.PORT || 3000;

const { Subject } = require("rxjs");
const { Observable } = require("rxjs/Observable");

const reactiveProxyjs = require('./reactiveProxy');


const subject = new Subject();
const obs = new Subject();
const testSubject = new Subject();
var blockchainProxy;
var queryProxy;

async function proxyConnexion() {
	try {

		proxies = await reactiveProxyjs.getProxies();
		blockchainProxy = proxies[0];
		queryProxy = proxies[1];

		blockchainProxy.subscribe({
			next(value) {
				data = JSON.parse(value);

				console.log(data);
				//io.emit('news', data);
                io.emit('new-message', data.message);
				console.log(`submitting value : ${data.message}`);
			},
			error(err) {
				io.emit('news', err);
			},
			complete() {
				io.emit('news', "Subject complete");
			}
		})
		//queryProxy.next("Do something for me please");

	} catch (error) {
		console.error(`Failed to submit transaction: ${error}`);
		process.exit(1);
	}
}

async function sendMessage(message) {
	try {
		//invokejs.main(contract, message);
		queryProxy.next(message);

	} catch (error) {
		console.error(`Failed to submit transaction: ${error}`);
		process.exit(1);
	}
}

proxyConnexion();
io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('new-message', (message) => {
      console.log(message);
      //io.emit('new-message', message);
      sendMessage(message);

    });
});


server.listen(port, () => {
    console.log(`started on port: ${port}`);
});
