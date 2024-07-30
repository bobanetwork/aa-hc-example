// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";

contract L1ToL2DepositScript is Script {
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address public deployerAddress = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    address constant L1_PORTAL_ADDRESS = 0x3fdc08D815cc4ED3B7F69Ee246716f2C8bCD6b07;

    function run() external {
        deployerAddress = vm.addr(deployerPrivateKey);
        console.log("Balance deployer =", deployerAddress.balance);
        console.log("----");
        vm.startBroadcast(deployerPrivateKey);

        // Send ETH directly to the portal address
        (bool success, ) = L1_PORTAL_ADDRESS.call{value: 1000}("");
        require(success, "L1 to L2 ETH transfer failed");

        vm.stopBroadcast();
    }
}