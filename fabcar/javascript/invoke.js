/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const connectionjs = require('./connection');
const channeljs = require('./channel');
module.exports = {
    main: async function main(contract, make) {
        try {
            // Submit the specified transaction.
            // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
            // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
            await contract.submitTransaction('createCar', 'USER1', make, 'Accord', 'Black', 'Tom');
            //const result = await contract.evaluateTransaction('queryAllCars');
            // await contract.evaluateTransaction("queryCar", "CAR1");
            console.log('Transaction has been submitted');

            // Disconnect from the gateway.
            // await gateway.disconnect();

        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            process.exit(1);
        }
    }
};



