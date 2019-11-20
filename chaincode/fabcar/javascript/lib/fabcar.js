/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
//var counterCar;
class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        //counterCar = 20;
        const cars = [
            {
                color: 'blue',
                make: 'Toyota',
                model: 'Prius',
                owner: 'Tomoko',
            },
            {
                color: 'red',
                make: 'Ford',
                model: 'Mustang',
                owner: 'Brad',
            },
            {
                color: 'green',
                make: 'Hyundai',
                model: 'Tucson',
                owner: 'Jin Soo',
            },
            {
                color: 'yellow',
                make: 'Volkswagen',
                model: 'Passat',
                owner: 'Max',
            },
            {
                color: 'black',
                make: 'Tesla',
                model: 'S',
                owner: 'Adriana',
            },
            {
                color: 'purple',
                make: 'Peugeot',
                model: '205',
                owner: 'Michel',
            },
            {
                color: 'white',
                make: 'Chery',
                model: 'S22L',
                owner: 'Aarav',
            },
            {
                color: 'violet',
                make: 'Fiat',
                model: 'Punto',
                owner: 'Pari',
            },
            {
                color: 'indigo',
                make: 'Tata',
                model: 'Nano',
                owner: 'Valeria',
            },
            {
                color: 'brown',
                make: 'Holden',
                model: 'Barina',
                owner: 'ITACHISEISEI',
            },
        ];

        const diplomas =  [
            {
                type: 'diploma',
                username: 'maxromai',
                school: 'VUB',
                study: 'computer_science',
                first_name: 'Maximilien',
                last_name: 'Romain',
            },
            {
                type: 'diploma',
                username: 'rniro',
                school: 'VUB',
                study: 'solvay',
                first_name: 'Robert',
                last_name: 'DeNiro',
            },
            {
                type: 'diploma',
                username: 'maxromai',
                school: 'ParisInstiture',
                study: 'acting',
                first_name: 'Enya',
                last_name: 'Baroux',
            },
        ];
        const grades = [
            {
                type: 'grade',
                username: 'maxromai',
                school: 'VUB',
                course: "Declarative_programming",
                grade: "17",
                first_name: 'Maximilien',
                last_name: 'Romain',
            },
            {
                type: 'grade',
                username: 'maxromai',
                school: 'VUB',
                course: "Project_management",
                grade: "18",
                first_name: 'Maximilien',
                last_name: 'Romain',
            },
        ];

        for (let i = 0; i < cars.length; i++) {
            cars[i].docType = 'car';
            await ctx.stub.putState('CAR' + i, Buffer.from(JSON.stringify(cars[i])));
            console.info('Added <--> ', cars[i]);
        }

        for (let i = 0; i < diplomas.length; i++) {
            await ctx.stub.putState('DIPLOMA' + i, Buffer.from(JSON.stringify(diplomas[i])));
            console.info('Added <--> ', diplomas[i]);
        }
        for (let i = 0; i < grades.length; i++) {
            await ctx.stub.putState('GRADE' + i, Buffer.from(JSON.stringify(grades[i])));
            console.info('Added <--> ', grades[i]);
        }
        const ids_json = {
            idCars: 10,
            idDiplomas: 3,
            idGrades: 2,
        };
        await ctx.stub.putState('IDS', Buffer.from(JSON.stringify(ids_json)));
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryCar(ctx, carNumber) {
        const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        console.log(carAsBytes.toString());
        return carAsBytes.toString();
    }

    async createCar(ctx, carNumber, make, model, color, owner) {
        console.info('============= START : Create Car ===========');

        //var carNumberBis = "CAR" + counterCar;
        //todo: inc id
        //NOTES: could just save something in the state which is the counter

        const car = {
        	carNumber,
            color,
            docType: 'car',
            make,
            model,
            owner,
        };
        //counterCar = counterCar + 1;
        await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(car)));
        console.info('============= END : Create Car ===========');
    }

    async createDiploma(ctx, diplomaId, username, school, study, first_name, last_name) {
        console.info('============= START : Create Diploma ===========');

        const newDiploma = {
            type: 'diploma',
            username: username,
            school: school,
            study: study,
            first_name: first_name,
            last_name: last_name,
        };
        await ctx.stub.putState(diplomaId, Buffer.from(JSON.stringify(newDiploma)));
        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(newDiploma)));
        console.info('============= END : Create Diploma ===========');
    }

    async createMessage(ctx, carNumber, message, model, color, owner) {
    	console.info('============= START : Create Message ===========');

    	const counterByte = await ctx.stub.getState('ID'); // get the car from chaincode state
    	const counterInt = counterByte.toString()["idNumber"];
    	console.log(counterInt);


    	await ctx.stub.putState('ID', Buffer.from(JSON.stringify({idNumber: counterInt.toString()})));
        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(counterInt)));

        /*const startKey = 'CAR0';
        const endKey = 'CAR999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        console.log(iterator);

        var finalKey = 'CAR0';
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));
                const Key = res.value.key;

                if (finalKey < Key) {
                	finalKey = res.value.key;
                }

            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                const car = {
		        	carNumber: finalKey,
		            color,
		            docType: 'car',
		            make: message,
		            model,
		            owner,
		        };
		        //counterCar = counterCar + 1;
		        await ctx.stub.putState(finalKey, Buffer.from(JSON.stringify(car)));
		        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(car)));
				console.info('============= END : Create Car ===========');
				return null;
            }
        }*/
    }

    async queryAllCars(ctx) {
        const startKey = 'CAR0';
        const endKey = 'CAR999';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        console.log(iterator);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify({ hello: "Hello" })));
                return JSON.stringify(allResults);
            }
        }
    }

    async queryAllData(ctx) {
        const startDiploma = 'DIPLOMA0';
        const endDiploma = 'DIPLOMA20';
        const startGrade = 'GRADE0';
        const endGrade = 'GRADE20';

        const iterator = await ctx.stub.getStateByRange("", "");

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify({ hello: "Hello" })));
                return JSON.stringify(allResults);
            }
        }
    }

    async changeCarOwner(ctx, carNumber, newOwner) {
        console.info('============= START : changeCarOwner ===========');

        const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        const car = JSON.parse(carAsBytes.toString());
        car.owner = newOwner;

        await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));

        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(car)));

        console.info('============= END : changeCarOwner ===========');
    }

}

module.exports = FabCar;
