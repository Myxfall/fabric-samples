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
            idDiplomas: 5,
            idGrades: 3,
            idModular: 1,
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

        console.info("------ TEST JSON OBJECT IN CHAINCODE -----");
        console.info(make);
        const testJson = JSON.parse(make);
        console.info(testJson);

        const car = {
        	carNumber,
            color,
            docType: 'car',
            make:"TESTCAR",
            model,
            owner,
        };
        //counterCar = counterCar + 1;
        await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(testJson)));
        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(testJson)));
        console.info('============= END : Create Car ===========');
    }

    async idIncremental(ctx, data_type) {
        console.info('============= START : TESING ID INC ===========');

        const idsAsBytes = await ctx.stub.getState('IDS');
        console.log(idsAsBytes.toString());

        const ids_json = JSON.parse(idsAsBytes.toString());

        var new_ids = ids_json;
        var new_id;
        switch (data_type) {
            case 'diploma':
                new_ids.idDiplomas = new_ids.idDiplomas + 1;
                new_id = new_ids.idDiplomas;
                break;
            case 'grade':
                new_ids.idGrades = new_ids.idGrades + 1;
                new_id = new_ids.idGrades;
                break;
            case 'modular':
                new_ids.idModular = new_ids.idModular + 1;
                new_id = new_ids.idModular;
                break;
        }

        console.log(new_ids.toString());

        await ctx.stub.putState('IDS', Buffer.from(JSON.stringify(new_ids)));

        console.info('============= END : TESING ID INC ===========');

        return new_id;
    }

    async createRecord(ctx, new_record) {
        console.info('============= START : Create New Academic Record ===========');

        const newModularId = await this.idIncremental(ctx, 'modular');

        const new_record_JSON = JSON.parse(new_record);
        console.info("Pushing new data to Academic ledger");
        console.info(new_record_JSON);

        await ctx.stub.putState('MODULAR' + newModularId, Buffer.from(JSON.stringify(new_record_JSON)));
        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(new_record_JSON)));

        console.info('============= END : Create New Academic Record ===========');
    }

    async createDiploma(ctx, username, school, study, first_name, last_name) {
        console.info('============= START : Create Diploma ===========');

        const newDiplomaId = await this.idIncremental(ctx, 'diploma');

        const newDiploma = {
            type: 'diploma',
            username: username,
            school: school,
            study: study,
            first_name: first_name,
            last_name: last_name,
        };
        await ctx.stub.putState('DIPLOMA'+newDiplomaId, Buffer.from(JSON.stringify(newDiploma)));
        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(newDiploma)));
        console.info('============= END : Create Diploma ===========');
    }

    async createGrade(ctx, username, school, course, grade, first_name, last_name) {
        console.info('============= START : Create Grade ===========');

        const newGradeId = await this.idIncremental(ctx, 'grade');

        const newGrade = {
            type: 'grade',
            username: username,
            school: school,
            course: course,
            grade: grade,
            first_name: first_name,
            last_name: last_name,
        };
        await ctx.stub.putState('GRADE'+newGradeId, Buffer.from(JSON.stringify(newGrade)));
        await ctx.stub.setEvent('sent', Buffer.from(JSON.stringify(newGrade)));
        console.info('============= END : Create Grade ===========');
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
