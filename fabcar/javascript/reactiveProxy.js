const { throwError, of, from, range, fromEvent, interval, timer, Subject, ReplaySubject } = require("rxjs");
const { map,mergeMap, flatMap, catchError, filter, take, delay, toArray, merge } = require("rxjs/operators");
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

var gateway;
var network;
var contract;

module.exports = {
	setupConnexion: async function(setup_json) {
		try {
			// Create a new gateway for connecting to our peer node.
			gateway = await connectionjs.gatewayConnection(setup_json.user);
			// Get the network (channel) our contract is deployed to.
			network = await channeljs.getChannel(gateway, setup_json.channel);
			// Get the contract from the network.
			contract = await channeljs.getContract(network, setup_json.contract);

			return {
				gateway: gateway,
				network: network,
				contract: contract
			};

		} catch (e) {
			console.log("***** Error during SETUP CONNEXION *****");
		}
	},
	transactionProxy: function(proxy) {
		try {
			transactionStream = new Subject()
			transactionStream
			.pipe(
				catchError(err =>  {
					console.log("====== Handling error and rethrow it ======");
					console.log(err);
					return throwError(err);
				})
			)
			.subscribe(
				value => {
					console.log("*** TransactionProxy: Sending new value to blockchain ***");
					try {
						this.transactionProxyContactBlockchain(proxy.contract, value, transactionStream);
					} catch (e) {
							console.log("======catching erorr in subscibre to see ========")
					}
					//invokejs.main(proxy.contract, value);
				},
				err => {
					console.log("*** TransactionProxy: error submitting value to blockchain***");
					console.log(err);
				},
				() => {
					console.log("*** TransactionProxy COMPLETED ***");
				}
			);

			return transactionStream;
		} catch (e) {
			console.log("***** Error during initialisation of TransactionProxy *****");
			console.log(e);
		}
	},
	transactionProxyContactBlockchain: async function(proxy, make, txStream) {
		try {
			var res_json = JSON.stringify(make);
			var args_array = [make.contractName];
            Object.keys(make.args).map((arg) => {
                args_array.push(make.args[arg]);
            })

			try {
                await contract.submitTransaction.apply(contract, args_array);
                console.log('Transaction has been submitted');
            } catch (e) {
                console.log("===> Error submitting TX with error : ");
                console.log(e);
                throw "============ ERROR THROWING TESTING ========";
            }
		} catch (e) {
			console.log("\n***** Error during initialisation of TransactionProxy *****");
			console.log("***** (step2) : Error filling data to TransactionProxy *****");
			console.log(e);
		}
	},
	sendTransaction: async function(proxy, make) {
		/*const txStream = new Subject();

		this.sendTransactionContactBlockchain(proxy, make, txStream);

		return txStream.asObservable();*/

		const observable = new Observable(async (subscriber) => {
			var res_json = JSON.stringify(make);
			var args_array = [make.contractName];
			Object.keys(make.args).map((arg) => {
				args_array.push(make.args[arg]);
			})

			try {
				console.log("===== TRansaction proxy CAlling TX ======");
				const something = await contract.submitTransaction.apply(contract, args_array);
				console.log("results");
				console.log(something);
				subscriber.next("succeed");
			} catch (e) {
				console.log("===== Error during sendTransaction =====");
				console.log(e);
				subscriber.error(e);
			}
		})

		return observable;
	},
	sendTransactionContactBlockchain: async function(proxy, make) {
		var res_json = JSON.stringify(make);
		var args_array = [make.contractName];
		Object.keys(make.args).map((arg) => {
			args_array.push(make.args[arg]);
		})

		try {
			console.log("===== TRansaction proxy CAlling TX ======");
			await contract.submitTransaction.apply(contract, args_array);
		} catch (e) {
			console.log("===== Error during sendTransaction =====");
			console.log(e);
			throw new Error("Something happened");
			throw throwError(e);
			throw e
		}
		return "succeed"
	},
	dataProxy: function(proxy, request) {
		try {
			/*const dataStream = new ReplaySubject();

			this.dataProxyContactBlockchain(proxy, dataStream, request);

			return dataStream.asObservable();*/

			const smartContractName = request.contract_name;
			const smartContractArgs = request.args;
			const contractConcat = [smartContractName].concat(smartContractArgs)

			return from(contract.evaluateTransaction.apply(proxy.contract, contractConcat)).pipe(
				flatMap(stream => from(JSON.parse(stream.toString())))
			);
		} catch (e) {
			console.log("***** Error during initialisation of DataProxy *****");
			console.log("***** (step1) : Error building the DataProxy stream *****");
			console.log(e);
		}
	},
	dataProxyContactBlockchain: async function(proxy, dataStream, request) {
		try {
			const smartContractName = request.contract_name;
			const smartContractArgs = request.args;
			const contractConcat = [smartContractName].concat(smartContractArgs)

			const contractResult = await contract.evaluateTransaction.apply(proxy.contract, contractConcat)
			const contractResultPARSED = JSON.parse(contractResult.toString());

			if (Array.isArray(contractResultPARSED)) {
				dataObs = from(contractResultPARSED);
				dataObs.subscribe(dataStream)
			} else {
				dataObs = of(contractResultPARSED);
				dataObs.subscribe(dataStream);
			}
		} catch (e) {
			console.log("\n***** Error during initialisation of DataProxy *****");
			console.log("***** (step2) : Error filling data to DataProxy *****");
			console.log(e);
		}
	},
	eventProxy: function(proxy, eventName) {
		try {
			var eventStream = new ReplaySubject();

			this.eventProxyContactBlockchain(proxy, eventStream, eventName);

			return eventStream.asObservable();
		} catch (e) {
			console.log("\n***** Error during initialisation of EventProxy *****");
			console.log("***** (step1) : Error building EventProxy *****");
			console.log(e);
		}
	},
	eventProxyContactBlockchain: async function(proxy, eventStream, eventName) {
		try {
			await proxy.contract.addContractListener('listener_message_sent', eventName, (err, event, blockNumber, transactionId, status) => {
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
					Key:"random",
					Record: new_json
				}

				console.log(sending_json);

				console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
				console.log('************************************ End Trade Event ************************************\n');

				eventStream.next(Buffer.from(JSON.stringify(sending_json)));
			});
		} catch (e) {
			console.log("\n***** Error during initialisation of EventProxy *****");
			console.log("***** (step2) : Error filling data to EventProxy *****");
			console.log(e);
		}
	},
	blocksProxy: function(proxy) {
		try {
			const blockhistoryStream = new ReplaySubject();

			// Function call to fill blocks history stream with blocks infos.
			// Done asynhcronously
			this.blocksProxyContactBlockchain(proxy, blockhistoryStream);

			return blockhistoryStream.asObservable();
		} catch (e) {
			console.log("***** Error during initialisation of BlocksProxy *****");
			console.log("***** (step1) : Error building BlocksProxy *****");
			console.log(e);
		}
	},
	blocksProxyContactBlockchain: async function(proxy, blockStream) {
		try {
			// Contact blockchain to retrieve blocks infos
			const channel = proxy.network.getChannel();
			const blockchainInfo = await channel.queryInfo();

			// Loop over blocks number to retrieve block infos from blockchain
			for (var blockNumber = 0; blockNumber < (blockchainInfo.height.low); blockNumber++) {
				blockStream.next(
					await channel.queryBlock(blockNumber)
				)
			}
			// Add a listener hook on the blockchain blocks
			const listener = await proxy.network.addBlockListener('my-block-listener', (err, block) => {
				if (err) {
					console.log(err);
					return;
				}
				console.log('\n*************** start block header **********************')
				console.log(util.inspect(block.header, {showHidden: false, depth: 5}))
				console.log('*************** end block header **********************\n')

				blockStream.next(block);
			});
		} catch (e) {
			console.log("\n***** Error during initialisation of BlocksProxy *****");
			console.log("***** (step2) : Error filling data to BlocksProxy *****");
			console.log(e);
		}
	},
	testBlocks: function(proxy) {
		try {
			const testStream = new ReplaySubject();

			this.testCall(testStream, proxy);

			return testStream.asObservable();
		} catch (e) {
			console.log("ERROR");
			console.log(e);
		}
	},
	testCall: async function(stream, proxy) {
		const channel = proxy.network.getChannel();
		const blockchainInfo = await channel.queryInfo();

		for (var blockNumber = 0; blockNumber < (blockchainInfo.height.low); blockNumber++) {
			stream.next(
				await channel.queryBlock(blockNumber)
			)
		}
	},

	getMainStream: async function() {
		try {
			// Create a new gateway for connecting to our peer node.
			gateway = await connectionjs.gatewayConnection('user1');
			// Get the network (channel) our contract is deployed to.
			network = await channeljs.getChannel(gateway, 'mychannel');
			// Get the contract from the network.
			contract = await channeljs.getContract(network, 'fabcar');

			moduleStream = new Subject();
			moduleStream.subscribe(
				//Maybe find a way of handling the promise/wait a bit better
				async (request) => {
					console.log("----- GOT QUERY FROM APPLICATION -----");

					switch (request.type) {
						case "specific_test":
							console.log("\t -> TESTING CASE");
							request.args.subscribe({
								next(value) {
									console.log(value);
								}
							})

							break;

						case "invoke_blockchain":
							console.log("\t -> Invoke blockchain by sending you data to network");

							// Invoke submit contract from invokejs module;

							invokejs.main(contract, request);

							break;

						case "query_blockchain":
							console.log("\t -> querying the blockchain by calling contract");

							const smartContractName = request.contract_name;
							const smartContractArgs = request.args;
							const contractConcat = [smartContractName].concat(smartContractArgs)

							const contractResult = await contract.evaluateTransaction.apply(contract, contractConcat)
							const contractResultPARSED = JSON.parse(contractResult.toString());
							//console.log(contractResultPARSED);

							var obs;
							if (Array.isArray(contractResultPARSED)) {
								console.log("*** Results is list, multiple object")

								obs = from(contractResultPARSED);
							} else {
								console.log("*** Results not List, one simple object")
								obs = of(contractResultPARSED);
							}
							// TODO: should send new observable to the server
							// as an answer. So maybe encapsulate it in a JSON
							obs.subscribe({
								next(value) {
									console.log(value);
								}
							})

							break;
						case "listen_blockchain":
							console.log("\t -> Add a new listener on the blockchain and retrieve new stream");

							var listening_subject = new ReplaySubject();

							await contract.addContractListener('listener_message_sent', request.eventName, (err, event, blockNumber, transactionId, status) => {
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
									Key:"random",
									Record: new_json
								}

								console.log(sending_json);

								console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
								console.log('************************************ End Trade Event ************************************\n');

								listening_subject.next(Buffer.from(JSON.stringify(sending_json)));
							});

							listening_subject.subscribe({
								next(value) {
									console.log("----- Listening events : got new data from blockchain");
									const new_value = JSON.parse(value);
									console.log(new_value);
								}
							})

							break;
						case "block_history":
							console.log("\t -> Get the blocks history of the blockchain as well as a listerner for new blocks");

							const channel = network.getChannel();
							const blockchainInfo = await channel.queryInfo();

							var blockhistoryStream = new ReplaySubject();
							for (var blockNumber = 0; blockNumber < (blockchainInfo.height.low); blockNumber++) {
								blockhistoryStream.next(
									await channel.queryBlock(blockNumber)
								)
							}
							const listener = await network.addBlockListener('my-block-listener', (err, block) => {
								if (err) {
									console.log(err);
									return;
								}
								console.log('\n*************** start block header **********************')
								console.log(util.inspect(block.header, {showHidden: false, depth: 5}))
								console.log('*************** end block header **********************\n')

								//blockhistoryStream.next(Buffer.from(JSON.stringify(block)));
								blockhistoryStream.next(block);
							});

							//*** TESTING PURPOSE
							blockhistoryStream.subscribe({
								next(value) {
									console.log("Value from the history block stream");
									console.log(value);
								}
							})

							break;
						default:
							console.log("***** The request is not defined by the module *****");
							break;
					}

					/* ===== REACTIVE LOGIC ======

						The logic of the main stream of the modul will happen here
						Meaning the different "queries" will arrive there and will be
						treated depending on the data they are asking.

						SOLUTION1: The simple solution is to encapsulate the query inside
						some kind of struct (JSON) with a type attribute predefined by the application.
						I can then just sort by this type and execute whatever is needed by the query.

						TYPES:
							* query_blockchain: Data from the blockchain.
							could be either one small data, or a bunch of information

							* listen_blockchain: A listener installed on the blockchain used to
							get new information from the blockchain

							* block_history: A mix of getting information from the blockchain
							and a listener that listens the new blocks added by the blockchain.
					*/
				}
			);

			return moduleStream;

		} catch (e) {
			console.log("error with something");
		}
	},
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

			/*

				Should provide a list of full blocks from the blockchain on a stream provided to the client
				// See function : <async> queryInfo(target, useAdmin) followed by bunch of <async> queryBlockByHash(blockHash, target, useAdmin, skipDecode)
				// to recompose the history of blocks

				The idea here would be the following:
				First call the "queryInfo" to get a "blockchainInfo" composed of the height, number of blocks, of the blockchain, current hash block and previous
				Then loop over the number of block and build the history of blocks

			*/

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
					Key:"random",
					Record: new_json
				}

				console.log(sending_json);

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
				if (Array.isArray(result_json)) {
					for (var elem in result_json) {
						console.log("Object nexted is : ", result_json[elem]);
						subject.next(Buffer.from(JSON.stringify(result_json[elem])));
					}
				} else {
						console.log("Object nexted is : ", result_json);
						subject.next(Buffer.from(JSON.stringify(result_json)));
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
