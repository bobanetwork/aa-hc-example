// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "forge-std/Test.sol";
import "../contracts/TokenPrice.sol";

contract MockHybridAccount {
    function CallOffchain(bytes32, bytes memory) public pure returns (uint32, bytes memory) {
        return (0, abi.encode("2000"));
    }
}

contract TokenPriceTest is Test {
    TokenPrice public tokenPrice;
    MockHybridAccount public mockHybridAccount;

    function setUp() public {
        mockHybridAccount = new MockHybridAccount();
        tokenPrice = new TokenPrice(payable(address(mockHybridAccount)));
    }

    function testFetchPrice() public {
        string memory token = "ETH";
        string memory expectedPrice = "2000";

        tokenPrice.fetchPrice(token);

        (string memory price, uint256 timestamp) = tokenPrice.tokenPrices(token);

        assertEq(price, expectedPrice);
        assertTrue(timestamp > 0);
    }
}
