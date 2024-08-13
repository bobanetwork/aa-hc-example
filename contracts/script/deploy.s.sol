// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/core/EntryPoint.sol";
import "../contracts/core/HCHelper.sol";
import "../contracts/samples/HybridAccountFactory.sol";
import "../contracts/samples/SimpleAccountFactory.sol";
import "../contracts/TokenPrice.sol";
//import "openzeppelin-contracts/contracts/mocks/InitializableMock.sol";
// forge script scripts/deploy.s.sol:DeployExample --rpc-url http://localhost:9545 --broadcast

contract DeployExample is Script {
    // Configs
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    string public backendURL = vm.envString("BACKEND_URL");
    address public bundlerAddress = vm.envAddress("BUNDLER_ADDR");
    address public deployerAddress;

    // Contracts
    EntryPoint public entrypoint;
    HCHelper public hcHelper;
    HybridAccount public hybridAccount;
    SimpleAccount public simpleAccount;
    SimpleAccountFactory public saf;

    function run() public {
        // Prepare and start Broadcast
        prepare();
        // Deploy all necessary contracts
        deployContracts();
        // Fund where needed, register urls, configure
        configureContracts();
        // log
        logContracts();
        vm.stopBroadcast();
    }

    function prepare() public {
        deployerAddress = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);
    }

    function deployContracts() public {
        entrypoint = new EntryPoint();
        hcHelper = new HCHelper(
            address(entrypoint),
            address(0x4200000000000000000000000000000000000023)
        );
        hybridAccount = new HybridAccount(
            IEntryPoint(entrypoint),
            address(hcHelper)
        );
        saf = new SimpleAccountFactory(entrypoint);
        simpleAccount = new SimpleAccount(IEntryPoint(entrypoint));
    }

    function configureContracts() public {
        if (hcHelper.systemAccount() != address(hybridAccount)) {
            hcHelper.initialize(deployerAddress, address(hybridAccount));
            hcHelper.SetPrice(0);
        }
        (bool suc, ) = address(entrypoint).call{value: 1 ether}("");
        require(suc, "Failed to send 1 ETH to entrypoint");
        uint256 minBalance = 0.01 ether;
        (uint112 bal, , , , ) = entrypoint.deposits(address(hybridAccount));
        if (bal < minBalance) {
            uint256 amountToDeposit = minBalance - bal;
            entrypoint.depositTo{value: amountToDeposit}(deployerAddress);
        }
        // register url, add credit
        hcHelper.RegisterUrl(address(hybridAccount), backendURL);
        hcHelper.AddCredit(address(hybridAccount), 100);
        // permit caller
        hybridAccount.initialize(deployerAddress);
        // fund the bundler
        (bool success, ) = bundlerAddress.call{value: 1 ether}("");
        require(success, "ETH transfer failed");
    }

    function logContracts() public view {
        console.log("ENTRY_POINTS=", address(entrypoint));
        console.log("HC_HELPER_ADDR=", address(hcHelper));
        console.log("OC_HYBRID_ACCOUNT=", address(hybridAccount));
        console.log("SIMPLE_ACCOUNT=", address(simpleAccount));
        console.log("CLIENT_PRIVKEY=", deployerPrivateKey);
        console.log("HC_SYS_OWNER", address(deployerAddress));
    }
}
