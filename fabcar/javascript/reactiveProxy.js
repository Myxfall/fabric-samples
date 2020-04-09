const { throwError, of, from, range, merge, fromEvent, interval, timer, Subject, ReplaySubject } = require("rxjs");
const { map,mergeMap, flatMap, catchError, filter, take, delay, find } = require("rxjs/operators");
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
	/*
		The push continuous query
		This is premade work to handle future new DSL blockchain related

		It accepts :
			* select: select fields from the ledger object
			* from: select the event-name submission
			* where: pre filter the stream
	*/
	pushQuery: async function(proxy, SQL_object) {
		try {
				var pushQuerySteam = new ReplaySubject();

				const select = SQL_object.select;
				const from = SQL_object.from;
				const where = SQL_object.where;

				console.log(select);
				console.log(from);
				console.log(where);

				// TODO: try get already created listener and not creating new one
				for (eventName in from) {
					await proxy.contract.addContractListener(from[eventName]+Math.random(), from[eventName], (err, event, blockNumber, transactionId, status) => {
						if (err) {
							console.error(err);
							return;
						}
						//convert event to something we can parse
						event = event.payload.toString();
						event = JSON.parse(event)

						var sending_json;
						if (select == "*") {
							sending_json = event;
							sending_json.status = status;
							sending_json.blockNumber = blockNumber;
							sending_json.transactionId = transactionId;
						} else {
							sending_json = {
								status: status,
								blockNumber: blockNumber,
								transactionId: transactionId,
							}
							for (var elem in select) {
								sending_json[select[elem]] = event[select[elem]];
							}
						}

						//pushQuerySteam.next(Buffer.from(JSON.stringify(sending_json)));
						pushQuerySteam.next(sending_json);
					});
				}

				return pushQuerySteam.asObservable();

		} catch (e) {
			console.log("***** Error during initialisation of continuous QueryProxy *****");
			console.log("***** (step1) : Error building the continuous QueryProx stream *****");
			console.log(e);
		}
	},
	ppQuery: async function(proxy, SQL_object) {
		try {
			const streamsArray = [];
			streamsArray.push(await this.pushQuery(proxy, SQL_object));

			for (var static in SQL_object.fromStatic) {
				console.log("calling contract with : ", SQL_object.fromStatic[static]);
				streamsArray.push(this.dataProxy(proxy, {
					contract_name: SQL_object.fromStatic[static],
					args: []
				}))
			}

			return merge(
				...streamsArray
			);

		} catch (e) {
			console.log("***** Error during initialisation of continuous PPProxy *****");
			console.log("***** (step1) : Error building the continuous PPProxy stream *****");
			console.log(e);
		}
	},
	tableProxy: function(proxy, SQL_object) {
		try {
			/*
				from: the stream where the Table is going to be build from
				groupBy: The structure of the returning json state
			*/
			const from = SQL_object.from;
			const groupBy = SQL_object.groupBy;

			var tableState = {};
			var tableStream = new ReplaySubject();

			from.subscribe({
				next(value) {
					var idName = "";
					for (elem in groupBy) {
						idName = idName + value[groupBy[elem]];
					}
					tableState[idName] = value;
					tableStream.next(tableState);
				}
			})

			return tableStream.asObservable()

		} catch (e) {
			console.log("***** Error during initialisation of TableProxy *****");
			console.log("***** (step1) : Error building the TableProxy stream *****");
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
	streamProcessing: function(proxy, SQL_object) {
		const select = SQL_object.select;
		const from = SQL_object.from;
		const where = SQL_object.where;

		const mergedStream = merge(...from);
		const selectedStream = mergedStream.pipe(
			map((stream_event) => {
				var sending_json = {};
				if (select == "*") {
					sending_json = stream_event;
				} else {
					for (var elem in select) {
						sending_json[select[elem]] = stream_event["Record"][select[elem]];
					}
				}
				return sending_json;
			})
		);

		return selectedStream;
	},
	transactionsProxy: function(proxy, blocksProxy, streamsToWatch) {
		/*
			streamsToWatch: [stream1, stream2]
		*/
		const mergedStreams = merge(...streamsToWatch);
		mergedStreams.subscribe({
			next(value) {
				console.log("mmmmm merged Streams comparison mmmmm");
				blocksProxy.pipe(
					find(block => value.transactionId == block.data.data[0].payload.header.channel_header.tx_id)
				).subscribe({
					next(value) {
						console.log("mmm GETTING TX BLOCK mmmm");
						//console.log(value.data.data[0].payload.header.channel_header);
					}
				})
			}
		});
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
	}
}
