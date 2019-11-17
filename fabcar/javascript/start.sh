#!/bin/bash

cd ..
version=${1}
newversion=2.16
command=${2}


CC_RUNTIME_LANGUAGE=node # chaincode runtime language is node.js
CC_SRC_PATH=/opt/gopath/src/github.com/chaincode/fabcar/javascript


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

    rm -rf ./hfc-key-store

    # launch network; create channel and join peer to channel
    cd ../first-network
    echo y | ./byfn.sh down
    echo y | ./byfn.sh up -a -n -s couchdb

    CONFIG_ROOT=/opt/gopath/src/github.com/hyperledger/fabric/peer
    ORG1_MSPCONFIGPATH=${CONFIG_ROOT}/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    ORG1_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    ORG2_MSPCONFIGPATH=${CONFIG_ROOT}/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    ORG2_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    ORDERER_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
    set -x

    echo "Installing smart contract on peer0.org1.example.com"
    docker exec \
      -e CORE_PEER_LOCALMSPID=Org1MSP \
      -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
      -e CORE_PEER_MSPCONFIGPATH=${ORG1_MSPCONFIGPATH} \
      -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_TLS_ROOTCERT_FILE} \
      cli \
      peer chaincode install \
        -n fabcar \
        -v $version \
        -p "$CC_SRC_PATH" \
        -l "$CC_RUNTIME_LANGUAGE"

    echo "Installing smart contract on peer1.org1.example.com"
    docker exec \
      -e CORE_PEER_LOCALMSPID=Org1MSP \
      -e CORE_PEER_ADDRESS=peer1.org1.example.com:8051 \
      -e CORE_PEER_MSPCONFIGPATH=${ORG1_MSPCONFIGPATH} \
      -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_TLS_ROOTCERT_FILE} \
      cli \
      peer chaincode install \
        -n fabcar \
        -v $version \
        -p "$CC_SRC_PATH" \
        -l "$CC_RUNTIME_LANGUAGE"

    echo "Installing smart contract on peer0.org2.example.com"
    docker exec \
      -e CORE_PEER_LOCALMSPID=Org2MSP \
      -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
      -e CORE_PEER_MSPCONFIGPATH=${ORG2_MSPCONFIGPATH} \
      -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_TLS_ROOTCERT_FILE} \
      cli \
      peer chaincode install \
        -n fabcar \
        -v $version \
        -p "$CC_SRC_PATH" \
        -l "$CC_RUNTIME_LANGUAGE"

    echo "Installing smart contract on peer1.org2.example.com"
    docker exec \
      -e CORE_PEER_LOCALMSPID=Org2MSP \
      -e CORE_PEER_ADDRESS=peer1.org2.example.com:10051 \
      -e CORE_PEER_MSPCONFIGPATH=${ORG2_MSPCONFIGPATH} \
      -e CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_TLS_ROOTCERT_FILE} \
      cli \
      peer chaincode install \
        -n fabcar \
        -v $version \
        -p "$CC_SRC_PATH" \
        -l "$CC_RUNTIME_LANGUAGE"


    echo "Upgrading network with version ${version}"
    docker exec \
      -e CORE_PEER_LOCALMSPID=Org1MSP \
      -e CORE_PEER_MSPCONFIGPATH=${ORG1_MSPCONFIGPATH} \
      cli \
      peer chaincode upgrade -o orderer.example.com:7050 -C mychannel -n fabcar -v $version -c '{"Args":[]}' -P "AND ('Org1MSP.member','Org2MSP.member')"

fi
