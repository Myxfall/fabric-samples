/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const connectionjs = require('./connection');
const channeljs = require('./channel');
module.exports = {
    main: async function main(contract, make) {
        try {
            var res_json = JSON.stringify(make);
            console.log(`\nInvoke Query with ${res_json}\n`);

            const {type, username, school, study, first_name, last_name, diplomaId} = make;

            // Submit the specified transaction.
            // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
            // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR10', 'Dave')
            //const tx_data = await contract.submitTransaction('createCar', 'CAR121', message, 'Accord', 'Black', 'Tom');
            const tx_data = await contract.submitTransaction('createDiploma', 'DIPLOMA'+diplomaId, username, school, study, first_name, last_name);
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
