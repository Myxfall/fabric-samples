const { range, fromEvent, interval, timer, Subject, ReplaySubject } = require("rxjs");
const { map, filter, take, delay, toArray, merge } = require("rxjs/operators");
const { Observable} = require("rxjs/Observable");
const util = require('util');


const subject = new ReplaySubject();
const obs = new Subject();
const bridgeSubject = new Subject();
const blocksSubject = new Subject();

// This establishes a connection to a gateway
const connectionjs = require('./connection');
// Get your channel
const channeljs = require('./channel');
// This invokes the smart contracts on hyperledger fabric
const invokejs = require('./invoke');

module.exports = {
	getProxies: async function(querySmartContracts, eventListeners) {
		try {
			// Create a new gateway for connecting to our peer node.
			gateway = await connectionjs.gatewayConnection('user1');
			// Get the network (channel) our contract is deployed to.
			network = await channeljs.getChannel(gateway, 'mychannel');
			// Get the contract from the network.
			contract = await channeljs.getContract(network, 'fabcar');

			const listener = await network.addBlockListener('my-block-listener', (err, block) => {
				if (err) {
					console.log(err);
					return;
				}

				console.log('\n*************** start block header **********************')
				console.log(util.inspect(block.header, {showHidden: false, depth: 5}))
				console.log('*************** end block header **********************\n')
				// console.log('*************** start block data **********************')
				// let data = block.data.data[0];
				// console.log(util.inspect(data, {showHidden: false, depth: 5}))
				// console.log('*************** end block data **********************')
				// console.log('*************** start block metadata ****************')
				// console.log(util.inspect(block.metadata, {showHidden: false, depth: 5}))
				// console.log('*************** end block metadata ****************')

				blocksSubject.next(Buffer.from(JSON.stringify(block)));

			});

			await contract.addContractListener('listener_message_sent','sent', (err, event, blockNumber, transactionId, status) => {
				if (err) {
					console.error(err);
					return;
				}

				//convert event to something we can parse
				event = event.payload.toString();
				event = JSON.parse(event)

				console.log(`\n************************************ Start Trade Event ************************************`);

				var new_json = event;
				new_json.status = status;
				new_json.blockNumber = blockNumber;
				new_json.transactionId = transactionId;

				var sending_json = {
					key:"random",
					record: new_json
				}

				console.log(sending_json.record);

				console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
				console.log('************************************ End Trade Event ************************************\n');

				bridgeSubject.next(Buffer.from(JSON.stringify(sending_json)));
			});

			// ----- RXJS Listening Subjects -----
			bridgeSubject.subscribe(subject);

			querySubject = new Subject();
			querySubject.subscribe({
				next(value) {
					console.log(`Reactive Component : Received value to query to blockchain with ${value}`);
					invokejs.main(contract, value);
				},
				eror(err) {
					console.log(`Something wrong happened`)
				},
				complete() {
					console.log(`Subject complete`);
				}
			})

			// Parsing different types of data to one single stream
			// Iterate through an array of smart contracts name, and evaluate them
			console.log("Running reactiveProxy with contracts : ", querySmartContracts);
			for (var contractIndex in querySmartContracts) {
				const smartContractName = querySmartContracts[contractIndex];
				const result = await contract.evaluateTransaction.apply(contract, smartContractName);

				//TODO: should map the structure of the returning JSON, this could also change

				var result_json = JSON.parse(result.toString());
				console.log("got result from blockchain with", result_json)
				for (var elem in result_json) {
					const data = {
						key: result_json[elem]["Key"],
						record: result_json[elem]["Record"],
					};
					console.log(data);
					subject.next(Buffer.from(JSON.stringify(data)));
				}
			}

			getSubject = subject.asObservable();
			return [getSubject, querySubject, blocksSubject];

		} catch (error) {
			console.error(`Failed to submit transaction: ${error}`);
			process.exit(1);
		}
	}
}
