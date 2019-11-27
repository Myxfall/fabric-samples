'use strict'

const express = require('express');
let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);
const port = 3000;

io.on('hello_server', () => {
	console.log('Hello received');
});

const fs = require('fs');

const { range, fromEvent, interval, timer, Subject, ReplaySubject } = require("rxjs");
const { map, filter, take, delay, toArray, merge } = require("rxjs/operators");
const { Observable} = require("rxjs/Observable");

const subject = new Subject();
const obs = new Subject();
const testSubject = new Subject();

// This establishes a connection to a gateway 
const connectionjs = require('./connection');
// Get your channel 
const channeljs = require('./channel');
// This invokes the smart contracts on hyperledger fabric
const invokejs = require('./invoke');

const reactiveProxyjs = require('./reactiveProxy');
//import { getProxies } from 'reactiveProxyModule';

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

				io.emit('news', data);
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

app.use(express.json());
app.get('/', (req, res) => {
	res.end(fs.readFileSync('./index.html'));
});

app.post('/send', (req, res) => {
    const message = req.body.message;
    console.log(req.body.message);
    // Read the message being sent here

    sendMessage(req.body.message);
    res.send('Complete');
});

proxyConnexion();
server.listen(port, () => console.log('Server is up and running'));

