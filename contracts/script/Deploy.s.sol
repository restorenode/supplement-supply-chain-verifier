// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/BatchHashRegistry.sol";

interface Vm {
    function envUint(string calldata name) external returns (uint256 value);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract Deploy {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (BatchHashRegistry registry) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(privateKey);
        registry = new BatchHashRegistry();
        vm.stopBroadcast();
    }
}
