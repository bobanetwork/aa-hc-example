// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/samples/HybridAccount.sol";
import "../contracts/core/HCHelper.sol";
import {HybridAccountFactory} from "../contracts/samples/HybridAccountFactory.sol";

contract RegisterUrl is Script {
    // Configs
    address public deployerAddress;
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY_OWNER");
    string public backendURL = vm.envString("BACKEND_URL"); // default backend for boba sepolia
    address public hcHelperAddr = vm.envAddress("HC_HELPER_ADDR"); // System-wide HCHelper

    // Contracts
    address public hybridAccount = vm.envAddress("HYBRID_ACCOUNT");
    address public entrypoint = vm.envAddress("ENTRY_POINT"); // system wide

    function run() public {
        deployerAddress = vm.addr(deployerPrivateKey);

        HCHelper hcHelper = HCHelper(hcHelperAddr); // make sure you don't deploy a new one here
        assert(address(hcHelper) == hcHelperAddr); // check if assigned properly

        vm.startBroadcast(deployerPrivateKey);

        assert(hcHelper.owner() == deployerAddress); // Wrong private key

        // register url, only owner - reach out to Boba foundation:
        hcHelper.RegisterUrl(hybridAccount, backendURL);
        vm.stopBroadcast();
    }
}