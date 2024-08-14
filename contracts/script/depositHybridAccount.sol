// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/samples/HybridAccount.sol";
import "../contracts/core/HCHelper.sol";
import {HybridAccountFactory} from "../contracts/samples/HybridAccountFactory.sol";

contract RegisterUrl is Script {
    // Configs
    address public deployerAddress;
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    string public backendURL = vm.envString("BACKEND_URL"); // default backend for boba sepolia
    address public hcHelperAddr = vm.envAddress("HC_HELPER_ADDR"); // System-wide HCHelper

    // Contracts
    address public hybridAccount = vm.envAddress("HYBRID_ACCOUNT");
    address public entrypoint = vm.envAddress("ENTRY_POINT"); // system wide
    address public paymaster = address(0x8223388f7aF211d84289783ed97ffC5Fefa14256); // system wide paymaster boba sepolia

    function run() public {
        deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        IEntryPoint(entrypoint).depositTo{value: 0.001 ether}(hybridAccount);
        IEntryPoint(entrypoint).depositTo{value: 0.001 ether}(paymaster);
        console.log(IEntryPoint(entrypoint).getDepositInfo(hybridAccount).deposit);
        console.log(IEntryPoint(entrypoint).getDepositInfo(paymaster).deposit);
        vm.stopBroadcast();
    }
}