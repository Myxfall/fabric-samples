'use strict'

const express = require('express');
const { FileSystemWallet, Gateway } = require('fabric-network');
let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);

io.on('hello_server', () => {
	console.log('Hello received');
});
const { uuid } = require('uuid');
const invokejs = require('./invoke');
const queryjs = require('./query');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
const fs = require('fs');

const { range, fromEvent, interval, timer, Subject, ReplaySubject } = require("rxjs");
const { map, filter, take, delay, toArray, merge } = require("rxjs/operators");
const { Observable} = require("rxjs/Observable");

const port = 3000;

const subject = new Subject(5);
const obs = new Subject();
const testSubject = new Subject();
var counter = 0;
var carNumber = 100;
var screenText = "";

async function addListener() {
	try {
		// Create a new file system based wallet for managing identities.
		const walletPath = path.join(process.cwd(), 'wallet');
		const wallet = new FileSystemWallet(walletPath);
		// console.log(`Wallet path: ${walletPath}`);

		// Check to see if we've already enrolled the user.
		const userExists = await wallet.exists('user1');
		if (!userExists) {
			console.log('An identity for the user "user1" does not exist in the wallet');
			console.log('Run the registerUser.js application before retrying');
			return;
		}

		// Create a new gateway for connecting to our peer node.
		const gateway = new Gateway();
		await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

		// Get the network (channel) our contract is deployed to.
		const network = await gateway.getNetwork('mychannel');

		// Get the contract from the network.
		const contract = await network.getContract('fabcar');

		console.log('ADDING CONTRACT LISTENER');
		await contract.addContractListener('listener_message_sent','sent', (err, event, blockNumber, transactionId, status) => {
			if (err) {
				console.error(err);
				return;
			}

				  //convert event to something we can parse 
			event = event.payload.toString();
			event = JSON.parse(event)

			//where we output the TradeEvent
			console.log('************************ Start Trade Event ************************************');
			console.log(`car color: ${event.color}`);
			console.log(`car model: ${event.model}`);
			console.log(`car owner: ${event.owner}`);
			console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
			console.log('************************ End Trade Event ************************************');

			console.log('\n---------------->  Event emmited -----> ');
			console.log("----- Listening Contracts addition -----");

			testSubject.next(`The car ${event.model} ${event.color} owned by ${event.owner} has been added within transaction Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);

		});

		// ----- RXJS Listening Subjects -----
		subject.subscribe({
			next(value) {
				io.emit('news', value);
				console.log("submitting value");
			},
			error(err) {
				io.emit('news', err);
			},
			complete() {
				io.emit('news', "Subject complete");
			}
		})
		obs.subscribe({
			async next(value) {
				var lastCar = await queryCar();
				console.log("Nexting value to webserve : " + lastCar.toString());
				//subject.next("Car added within block: " + lastCar.toString());
				subject.next("Car added with informations : " + value + " \ncar infos :" + lastCar);
			},
			error(err) {
				io.emit('news', err);
			},
			complete() {
				io.emit('news', "Subject complete");
			}
		})
		testSubject.subscribe(subject);

		const listener = await network.addBlockListener('my-block-listener', (error, block) => {
			if (error) {
				console.error(error);
				return;
			}
			//io.emit('news', 'New message was added');
			console.log('\n-------Event emitted by socket---------------');
			console.log('----- Listening Block added -----\n')
			//console.log(`Block: ${JSON.stringify(block.data.data)}`);

			// ---- Send value to RxJS Subject -----
			//obs.next("Adding new car within block");
		});
		// Disconnect from the gateway.
		//await gateway.disconnect();

	} catch (error) {
		console.error(`Failed to submit transaction: ${error}`);
		process.exit(1);
	}
}

async function queryCars() {
	try {

		// Create a new file system based wallet for managing identities.
		const walletPath = path.join(process.cwd(), 'wallet');
		const wallet = new FileSystemWallet(walletPath);
		// console.log(`Wallet path: ${walletPath}`);

		// Check to see if we've already enrolled the user.
		const userExists = await wallet.exists('user1');
		if (!userExists) {
			console.log('An identity for the user "user1" does not exist in the wallet');
			console.log('Run the registerUser.js application before retrying');
			return;
		}

		// Create a new gateway for connecting to our peer node.
		const gateway = new Gateway();
		await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

		// Get the network (channel) our contract is deployed to.
		const network = await gateway.getNetwork('mychannel');

		// Get the contract from the network.
		const contract = network.getContract('fabcar');

		//await contract.submitTransaction('createCar', 'CAR999999', "PORSCHE", 'Accord', 'Black', 'Tom');


		console.log("Adding Car cars");
		await contract.submitTransaction('createCar', 'CAR'+carNumber, "FERRARI"+carNumber, 'Accord', 'Black', 'Tom');
		carNumber = carNumber+1;

		//const result = await contract.evaluateTransaction('queryAllCars');	
		//console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

	} catch (error) {
		console.error(`Failed to submit transaction: ${error}`);
		process.exit(1);
	}
}

async function queryCar() {
		try {

		// Create a new file system based wallet for managing identities.
		const walletPath = path.join(process.cwd(), 'wallet');
		const wallet = new FileSystemWallet(walletPath);
		// console.log(`Wallet path: ${walletPath}`);

		// Check to see if we've already enrolled the user.
		const userExists = await wallet.exists('user1');
		if (!userExists) {
			console.log('An identity for the user "user1" does not exist in the wallet');
			console.log('Run the registerUser.js application before retrying');
			return;
		}

		// Create a new gateway for connecting to our peer node.
		const gateway = new Gateway();
		await gateway.connect(ccpPath, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: true } });

		// Get the network (channel) our contract is deployed to.
		const network = await gateway.getNetwork('mychannel');

		// Get the contract from the network.
		const contract = network.getContract('fabcar');

		//await contract.submitTransaction('createCar', 'CAR999', 'FERRARI', 'Accord', 'RED', 'Gates');
		
		console.log("Query last car");		
		const result = await contract.evaluateTransaction('queryCar', 'CAR'+(carNumber-1));
		const res = result.toString();
		console.log(`Transaction has been evaluated, result is: ` + res);

		return res;

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
	console.log('This is a new message');
	console.log("---------- END TEST ----------")
	// Read the message being sent here
	invokejs.main("new message");
	res.send('Complete');
});

app.post('/testAPI', (req, res) => {
	console.log("\n--------- TEST API ----------\n")
	queryCars();
	res.send('Complete');
});

addListener();
server.listen(port, () => console.log('Server is up and running'));

