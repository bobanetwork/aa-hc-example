// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/samples/HybridAccount.sol";

contract DeployExample is Script {
    // Configs
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address public deployerAddress;

    // Contracts
    HybridAccount public hybridAccount;

    function run() public {
        deployerAddress = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);
        hybridAccount = new HybridAccount(
            IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789),
            address(0x587a06089ed54101dd6d9A8ecDe1d146f97Af6B8)
        );
        hybridAccount.initialize(deployerAddress);
        console.log(address(hybridAccount));
        vm.stopBroadcast();
    }
}