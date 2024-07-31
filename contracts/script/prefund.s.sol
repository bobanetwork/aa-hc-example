// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";

interface IL1StandardBridge {
    function depositETH(
        uint32 _l2Gas,
        bytes calldata _data
    ) external payable;
}

contract L1ToL2DepositScript is Script {
    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address private l1StandardBridge = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
    uint256 private l2GasLimit = 10_300_000;
    bytes private byteData = abi.encodePacked(block.timestamp);

    function run() external {
        address deployerAddress = vm.addr(deployerPrivateKey);

        IL1StandardBridge bridge = IL1StandardBridge(l1StandardBridge);

        // need to prank single; function can only be called from an EOA
        vm.prank(deployerAddress);
        bridge.depositETH{value: 10}(
            uint32(l2GasLimit),
            byteData
        );

        vm.stopPrank();
    }
}