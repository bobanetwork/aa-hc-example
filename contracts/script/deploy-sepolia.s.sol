// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/HybridAccount.sol";
import "../contracts/HybridAccountFactory.sol";
import "../contracts/HCHelper.sol";
import "../contracts/TokenPrice.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";
import "@account-abstraction/contracts/samples/SimpleAccountFactory.sol";
import "@account-abstraction/contracts/samples/TokenPaymaster.sol";
import "@account-abstraction/contracts/samples/VerifyingPaymaster.sol";
import "@account-abstraction/contracts/samples/VerifyingPaymaster.sol";

contract DeployExample is Script {
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address public deployerAddress;
    string public backendURL = vm.envString("BACKEND_URL");
    address public hcHelperAddr = vm.envAddress("HC_HELPER_ADDR");
    address public entrypoint = vm.envAddress("ENTRY_POINTS");
    address public haFactory = vm.envAddress("HA_FACTORY");

    HybridAccount public hybridAccount;
    IHCHelper public hcHelper;
    TokenPaymaster public tokenPaymaster;

    function run() public {
        deployerAddress = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // Init HCHelper
        hcHelper = IHCHelper(vm.envAddress("HC_HELPER_ADDR"));
        hybridAccount = HybridAccountFactory(haFactory).createAccount(deployerAddress, block.number);
        console.log("Hybrid Account Created:");
        console.log(address(hybridAccount));

        if (address(hybridAccount).balance < 0.01 ether) {
            payable(address(hybridAccount)).transfer(
                0.001 ether - address(hybridAccount).balance
            );
        }

        TokenPrice tokenPrice = new TokenPrice(payable(hybridAccount));
        console.log("Contract created");

        console.log("Allowance before:", IERC20(0x4200000000000000000000000000000000000023).allowance(deployerAddress, address(hcHelper)));
        IERC20(0x4200000000000000000000000000000000000023).approve(address(hcHelper), 30000000000000000);
        console.log("Allowance after:", IERC20(0x4200000000000000000000000000000000000023).allowance(deployerAddress, address(hcHelper)));

        // Permit caller
        hybridAccount.PermitCaller(address(tokenPrice), true);
        console.log(address(deployerAddress));

        console.log("\n=== Deployment Verification ===");
        console.log("HCHelper address:", address(hcHelper));
        console.log("HybridAccount address:", address(hybridAccount));
        console.log("TokenPrice address:", address(tokenPrice));
        console.log("Deployer address:", deployerAddress);

        try hybridAccount.owner() returns (address owner) {
            console.log("HybridAccount owner:", owner);
        } catch {
            console.log("Could not fetch HybridAccount owner");
        }

        console.log("HybridAccount balance:", address(hybridAccount).balance);

        vm.stopBroadcast();
    }
}