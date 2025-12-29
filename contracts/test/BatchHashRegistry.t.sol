// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/BatchHashRegistry.sol";

contract BatchHashRegistryTest {
    BatchHashRegistry private registry;

    function setUp() public {
        registry = new BatchHashRegistry();
    }

    function testPublishesSuccessfully() public {
        bytes32 batchIdHash = keccak256("VA-2025-0001");
        bytes32 attestationHash = keccak256("attestation-1");

        registry.publish(batchIdHash, attestationHash);
        _assertEq(registry.get(batchIdHash), attestationHash, "hash stored");
    }

    function testCannotPublishSameBatchIdHashTwice() public {
        bytes32 batchIdHash = keccak256("VA-2025-0002");

        registry.publish(batchIdHash, keccak256("attestation-1"));

        try registry.publish(batchIdHash, keccak256("attestation-2")) {
            revert("expected revert");
        } catch Error(string memory reason) {
            _assertStringEq(reason, "ALREADY_PUBLISHED", "revert reason");
        } catch {
            revert("unexpected revert type");
        }
    }

    function testGetReturnsStoredHash() public {
        bytes32 batchIdHash = keccak256("VA-2025-0003");
        bytes32 attestationHash = keccak256("attestation-3");

        registry.publish(batchIdHash, attestationHash);
        bytes32 fetched = registry.get(batchIdHash);

        _assertEq(fetched, attestationHash, "get matches");
    }

    function _assertEq(bytes32 actual, bytes32 expected, string memory message) internal pure {
        require(actual == expected, message);
    }

    function _assertStringEq(string memory actual, string memory expected, string memory message) internal pure {
        require(keccak256(bytes(actual)) == keccak256(bytes(expected)), message);
    }
}
