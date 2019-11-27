/* This file provides a connection to the hyperledger gabric network
Via a gateway*/ 
const { FileSystemWallet, Gateway } = require('fabric-network');

// Path is used for creating paths to directories
const path = require('path');
// Resolve a path to our connection file - details not known 
const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
console.log(ccpPath);

// Helps read the contents of our file system wallet 
module.exports = {
	gatewayConnection: async function(username) {
		// try to make a connection
		try{
			// Create a new file system based wallet for managing identities.
	        //const walletPath = path.join(process.cwd(), 'wallet');
	        console.log(path.resolve(ccpPath, '..','..', 'fabcar', 'javascript', 'wallet'));
	        const walletPath = path.resolve(ccpPath, '..','..', 'fabcar', 'javascript', 'wallet');
	        console.log(walletPath);
	        
	        
	        
	        // Get hold of the fs wallet 
	        const wallet = new FileSystemWallet(walletPath);

	        // check if the username provided exists in the wallet 
	         // Check to see if we've already enrolled the user.
	        const userExists = await wallet.exists('user1');
	        if (!userExists) {
	            console.log('An identity for the user '.concat(username, ' does not exist in the wallet'));
	            return {gateway: null};
	        }

	        // Create a new gateway for connecting to our peer node.
	        const gateway = new Gateway();
	        // connect the user to the gateway
	        await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });
        	
        	// return the gateway
        	return gateway;

		}catch(err) {
			return {gateway: null, error: err}
		}
	}
}

