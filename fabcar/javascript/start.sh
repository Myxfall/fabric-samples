#!/bin/bash

cd ..
version=${1}
echo "Running script with version ${version}"

echo "Running startFabric"
./startFabric.sh javascript $version

echo "Finished - Preparing Blockchain network"
cd javascript
rm -r wallet/

echo "Creating Admin & User"
node enrollAdmin.js
node registerUser.js