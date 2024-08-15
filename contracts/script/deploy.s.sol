// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/core/EntryPoint.sol";
import "../contracts/core/HCHelper.sol";
import "../contracts/samples/HybridAccountFactory.sol";
import "../contracts/samples/SimpleAccountFactory.sol";
import "../contracts/samples/TokenPaymaster.sol";
import "../contracts/TokenPrice.sol";
import "../contracts/samples/VerifyingPaymaster.sol";

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
    VerifyingPaymaster public verifyingPaymaster;
    TokenPaymaster public tokenPaymaster;
    TokenPrice public tokenPrice;
    SimpleAccount public simpleAccount;
    SimpleAccountFactory public saf;
    HybridAccountFactory public haf;

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

        saf = new SimpleAccountFactory(entrypoint);
        haf = new HybridAccountFactory(entrypoint, address(hcHelper));

        // use block number to always deploy fresh HA & SA
        hybridAccount = haf.createAccount(deployerAddress, block.number);

        tokenPrice = new TokenPrice(payable(hybridAccount));
        hybridAccount.PermitCaller(address(tokenPrice), true);

        verifyingPaymaster = new VerifyingPaymaster(entrypoint, address(deployerAddress));
        tokenPaymaster = new TokenPaymaster(address(haf), "sym", IEntryPoint(entrypoint));

        entrypoint.depositTo{value: 0.1 ether}(address(hybridAccount)); // only needed for HA
        verifyingPaymaster.deposit{value: 0.1 ether}();
        tokenPaymaster.deposit{value: 0.1 ether}();
        console.log(address(hybridAccount));

        simpleAccount = saf.createAccount(deployerAddress, block.number);
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
        hcHelper.AddCredit(address(hybridAccount), 1_000_000);
        // permit caller
        hybridAccount.initialize(deployerAddress);
        // fund the bundler
        (bool success, ) = bundlerAddress.call{value: 1 ether}("");
        require(success, "ETH transfer failed");

        entrypoint.depositTo{value: 0.1 ether}(address(tokenPaymaster));
        entrypoint.depositTo{value: 0.1 ether}(address(verifyingPaymaster));
    }

    function logContracts() public view {
        console.log("ENTRY_POINTS=", address(entrypoint));
        console.log("HC_HELPER_ADDR=", address(hcHelper));
        console.log("OC_HYBRID_ACCOUNT=", address(hybridAccount));
        console.log("SIMPLE_ACCOUNT=", address(simpleAccount));
        console.log("HA_FACTORY=", address(haf));
        console.log("SA_FACTORY=", address(saf));
        console.log("CLIENT_PRIVKEY=", deployerPrivateKey);
        console.log("HC_SYS_OWNER", address(deployerAddress));
    }
}
