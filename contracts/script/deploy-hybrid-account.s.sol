// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/samples/HybridAccount.sol";
import "../contracts/core/HCHelper.sol";

contract DeployExample is Script {
    // Configs
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    string public backendURL = "https://aa-hc-example.onrender.com/hc"; // default backend for boba sepolia
    address public deployerAddress;
    address public hcHelperAddr = address(0x1c64EC0A5E2C58295c3208a63209A2A719dF68D8); // System-wide HCHelper

    // Contracts
    HybridAccount public hybridAccount;
    HCHelper public hcHelper;
    address public entrypoint = address(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

    function run() public {
        deployerAddress = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        hcHelper = new HCHelper(
            entrypoint,
            hcHelperAddr
        );

        hybridAccount = new HybridAccount(
            IEntryPoint(entrypoint), // System-wide Entrypoint
            hcHelperAddr
        );
        hybridAccount.initialize(deployerAddress);
        console.log(address(hybridAccount));


        // register url, add credit
        // only owner - reach out to Boba foundation: hcHelper.RegisterUrl(address(hybridAccount), backendURL);
        hcHelper.AddCredit(address(hybridAccount), 100);
        // permit caller
        hybridAccount.initialize(deployerAddress);
        vm.stopBroadcast();
    }
}