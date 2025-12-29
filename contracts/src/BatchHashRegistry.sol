// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BatchHashRegistry {
    mapping(bytes32 => bytes32) public attestationHashByBatchId;

    event Published(bytes32 indexed batchIdHash, bytes32 attestationHash, address publisher, uint256 timestamp);

    function publish(bytes32 batchIdHash, bytes32 attestationHash) external {
        require(batchIdHash != bytes32(0), "BATCH_ID_REQUIRED");
        require(attestationHash != bytes32(0), "ATTESTATION_REQUIRED");
        require(attestationHashByBatchId[batchIdHash] == bytes32(0), "ALREADY_PUBLISHED");

        attestationHashByBatchId[batchIdHash] = attestationHash;
        emit Published(batchIdHash, attestationHash, msg.sender, block.timestamp);
    }

    function get(bytes32 batchIdHash) external view returns (bytes32) {
        return attestationHashByBatchId[batchIdHash];
    }
}
