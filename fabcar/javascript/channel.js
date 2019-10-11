module.exports = {
	getChannel: async function(gateway, channel) {
		// Get a handle to the channel
		try{
			const network = await gateway.getNetwork(channel)
			return network;
		}catch(err){
			return null;
		}
	},

	getContract: async function(network, contract_name) {
		try{
			const contract = await network.getContract(contract_name);
			return contract;
		}catch(err) {
			null;
		}
	}
}