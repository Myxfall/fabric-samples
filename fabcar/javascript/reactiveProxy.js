const { range, fromEvent, interval, timer, Subject, ReplaySubject } = require("rxjs");
const { map, filter, take, delay, toArray, merge } = require("rxjs/operators");
const { Observable} = require("rxjs/Observable");
const util = require('util');


const subject = new ReplaySubject();
const obs = new Subject();
const testSubject = new Subject();

// This establishes a connection to a gateway
const connectionjs = require('./connection');
// Get your channel
const channeljs = require('./channel');
// This invokes the smart contracts on hyperledger fabric
const invokejs = require('./invoke');

module.exports = {
	getProxies: async function() {
		try {
			// Create a new gateway for connecting to our peer node.
	        gateway = await connectionjs.gatewayConnection('user1');
	        // Get the network (channel) our contract is deployed to.
	        network = await channeljs.getChannel(gateway, 'mychannel');
	        // Get the contract from the network.
	        contract = await channeljs.getContract(network, 'fabcar');

			//our block listener is listening to our channel, and seeing if any blocks are added to our channel
			const listener = await network.addBlockListener('my-block-listener', (err, block) => {
		      if (err) {
		        console.log(err);
		        return;
		      }

		      console.log('*************** start block header **********************')
		      console.log(util.inspect(block.header, {showHidden: false, depth: 5}))
		      console.log('*************** end block header **********************')
		      console.log('*************** start block data **********************')
		      let data = block.data.data[0];
		      console.log(util.inspect(data, {showHidden: false, depth: 5}))
		      console.log('*************** end block data **********************')
		      console.log('*************** start block metadata ****************')
		      console.log(util.inspect(block.metadata, {showHidden: false, depth: 5}))
		      console.log('*************** end block metadata ****************')

		  });

		//   const listener = await network.addBlockListener('my-block-listener', (error, block) => {
        //     if (error) {
        //         console.error(error);
        //         return;
        //     }
        //     console.log('------- BLOCK LISTENER : NEW BLOCK ADDED ---------------');
        //     console.log(`Block: ${JSON.stringify(block.data.data)}`);
        // });

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
				console.log(`car number: ${event.carNumberBis} or ${event.carNumber} ${event.hello}`);
				console.log(`car color: ${event.color}`);
				console.log(`car model: ${event.model}`);
				console.log(`car owner: ${event.owner}`);
				console.log(`User ${event.carNumber} sent ${event.make}`);
				console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
				console.log('************************ End Trade Event ************************************');

				//testSubject.next(`The car ${event.model} ${event.color} owned by ${event.owner} has been added within transaction Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
				//testSubject.next(`User ${event.user} sent the message : ${event.make}`);

				const data = {
					user: event.owner,
					message: event.make,
					status: status,
				};
				testSubject.next(Buffer.from(JSON.stringify(data)));

			});

			// ----- RXJS Listening Subjects -----

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

			const result = await contract.evaluateTransaction('queryAllCars');
			var result_json = JSON.parse(result.toString());
			for (var elem in result_json) {
				const data = {
					key: result_json[elem]["Key"],
					message: result_json[elem]["Record"]["make"],
				};
				console.log(data);
				subject.next(Buffer.from(JSON.stringify(data)));
			}

			getSubject = subject.asObservable();
			return [getSubject, querySubject];

		} catch (error) {
			console.error(`Failed to submit transaction: ${error}`);
			process.exit(1);
		}
	}
}
