// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/samples/HybridAccount.sol";
import "../contracts/core/HCHelper.sol";
import {HybridAccountFactory} from "../contracts/samples/HybridAccountFactory.sol";

contract DeployExample is Script {
    // Configs
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address public deployerAddress;
    string public backendURL = vm.envString("BACKEND_URL"); // default backend for boba sepolia
    address public hcHelperAddr = vm.envAddress("HC_HELPER_ADDR"); // System-wide HCHelper

    // Contracts
    address public entrypoint = vm.envAddress("ENTRY_POINT"); // system wide
    address public haFactory = address(0x3DD6EE2e539CCd7EaB881173fB704f766e877848); // System-wide Account factory

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

        // Deploy using HybridAccountFactory, salt = block.number to force redeploy HybridAccount if already existing from this wallet
        hybridAccount = HybridAccountFactory(haFactory).createAccount(deployerAddress, block.number);
        IEntryPoint(entrypoint).depositTo{value: 0.001 ether}(address(hybridAccount));
        console.log(address(hybridAccount));


        // register url, add credit
        // only owner - reach out to Boba foundation: hcHelper.RegisterUrl(address(hybridAccount), backendURL);
        hcHelper.AddCredit(address(hybridAccount), 100);
        // permit caller
        // not needed most likely: hybridAccount.initialize(deployerAddress);
        vm.stopBroadcast();
    }
}