#!/bin/bash

cd ..
version=${1}
command=${2}


CC_RUNTIME_LANGUAGE=node # chaincode runtime language is node.js
CC_SRC_PATH=/opt/gopath/src/github.com/chaincode/fabcar/javascript


echo "Running start.sh with ${command} script with version $version" >> logs_start.txt
if [ "$command" = "start" ]; then
    echo "Running script with version ${version}"

    echo "Running startFabric"
    ./startFabric.sh javascript $version

    echo "Finished - Preparing Blockchain network"
    cd javascript
    rm -r wallet/

    echo "Creating Admin & User"
    node enrollAdmin.js
    node registerUser.js
elif [ "$command" = "upgrade" ]; then

    echo "Running upgrade script with version $version"

    ./startFabric.sh javascript $version upgrade


fi
