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
            console.log("\nInvoke Query with ");
            console.log(res_json);

            // TODO: json example build here. This JSON structure will be send to the network.
            // Need to make this json structure being able to be send with the TX arguments
            /*const json_EXAMPLE = {
                contractName: contractName,
                args: {
                    username,
                    school,
                    study,
                    first_name,
                    last_name
                    ...
                }
            }*/


            // Building the array args with the contract name that is going to be called
            var args_array = [make.contractName];
            Object.keys(make.args).map((arg) => {
                args_array.push(make.args[arg]);
            })
            console.log("Array argument being called :");
            console.log(args_array);

            //const tx_data = await contract.submitTransaction('createCar', 'CAR55', res_json, 'Accord', 'Black', 'Tom');
            //const tx_data = await contract.submitTransaction('createDiploma', 'DIPLOMA'+diplomaId, username, school, study, first_name, last_name);
            //const tx_data = await contract.submitTransaction('createRecord', res_json);

            // Try to call the submitTransaction with dynamic attributes, meaning you dont know them before.
            await contract.submitTransaction.apply(contract, args_array);

            console.log('Transaction has been submitted');

            // Disconnect from the gateway.
            // await gateway.disconnect();

        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            process.exit(1);
        }
    }
};
