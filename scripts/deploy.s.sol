// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "forge-std/Script.sol";
import "../contracts/core/EntryPoint.sol";
import "../contracts/core/HCHelper.sol";
import "../contracts/samples/HybridAccountFactory.sol";
import "../contracts/samples/SimpleAccountFactory.sol";
import "../contracts/TokenPrice.sol";
//import "openzeppelin-contracts/contracts/mocks/InitializableMock.sol";
// forge script scripts/deploy.sol:DeployExample --rpc-url http://localhost:8545 --broadcast
contract DeployExample is Script {
    // Configs
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    string public  backendURL = vm.envString("BACKEND_URL");
    address public deployerAddress;
    // Contracts
    EntryPoint public entrypoint;
    HCHelper public hcHelper;
    HybridAccount public hybridAccount;
    TokenPrice public tokenPrice;
    SimpleAccount public simpleAccount;
    function run() public {
        // Prepare and start Broadcast
        prepare();
        // Deploy all necessary contracts
        deployContracts();
        // Fund where needed, register urls, configure
        configureContracts();
        vm.stopBroadcast();
    }
    function prepare() public {
        deployerAddress = vm.addr(deployerPrivateKey);
        console.log("Balance deployer =", deployerAddress.balance);
        console.log("----");
        vm.startBroadcast(deployerPrivateKey);
    }
    function deployContracts() public {
        // EntryPoint
        entrypoint = new EntryPoint();
        console.log("EntryPoint deployed to:", address(entrypoint));
        // HCHelper
        hcHelper = new HCHelper(address(entrypoint), address(0x4200000000000000000000000000000000000023), 0);
        console.log("HCHelper deployed to: ", address(hcHelper));
        // HybridAccount
        hybridAccount = new HybridAccount(IEntryPoint(entrypoint), address(hcHelper));
        console.log("HybridAccount deployed to: ", address(hcHelper));
        // TestTokenPrice
        tokenPrice = new TokenPrice(payable(address(hcHelper)));
        console.log("TestTokenPrice deployed to: ", address(tokenPrice));
        // TestTokenPrice
        simpleAccount = new SimpleAccount(IEntryPoint(entrypoint));
        console.log("TestTokenPrice deployed to: ", address(simpleAccount));
    }
    function configureContracts() public {
        if (hcHelper.systemAccount() != address(hybridAccount)) {
            hcHelper.initialize(msg.sender, address(hybridAccount));
        }
        (uint112 bal,,,,) = entrypoint.deposits(address(hybridAccount));
        if (bal < 0.01 ether) {
            entrypoint.depositTo{value: 0.01 ether - bal}(address(address(hybridAccount)));
        }
        // register url, add credit
        hcHelper.RegisterUrl(address(hybridAccount), backendURL);
        hcHelper.AddCredit(address(hybridAccount), 100);
        // permit caller
        hybridAccount.initialize(deployerAddress);
        hybridAccount.PermitCaller(address(tokenPrice), true);
    }
}