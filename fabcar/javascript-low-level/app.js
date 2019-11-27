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
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
const fs = require('fs');


const port = 3000;

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
		const contract = network.getContract('fabcar');
		console.log('ADDING CONTRACT LISTENER');
		const x = await contract.addContractListener('listener_message_sent','sent', (err, event, blockNumber, transactionId, status) => {
			console.log('\n---------------->  Event emmited -----> ');
			console.log("----- Listening Contracts addition -----");
			let data = 'New File Contents';

			io.emit('news', 'New car was added');

			if (err) {
				console.error(err);
				return;
			}
			console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
			});

		const listener = await network.addBlockListener('my-block-listener', (error, block) => {
			if (error) {
				console.error(error);
				return;
			}
			//io.emit('news', 'New message was added');
			console.log('\n-------Event emitted by socket---------------');
			console.log('----- Listening Block added -----\n')
			//console.log(`Block: ${JSON.stringify(block.data.data)}`);
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


		console.log("Querying cars");

		const result = await contract.evaluateTransaction('queryAllCars');
		console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

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

