// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "forge-std/Test.sol";
import "../contracts/TokenPrice.sol";

contract MockHybridAccount {
    function CallOffchain(bytes32, bytes memory) public pure returns (uint32, bytes memory) {
        return (0, abi.encode("2000"));
    }
}

/** @dev Unit tests */
contract TokenPriceTest is Test {
    TokenPrice public tokenPrice;
    MockHybridAccount public mockHybridAccount;

    function setUp() public {
        mockHybridAccount = new MockHybridAccount();
        tokenPrice = new TokenPrice(payable(address(mockHybridAccount)));
    }

//    function testFetchPrice() public {
//        string memory token = "ETH";
//        string memory expectedPrice = "2000";
//
//        tokenPrice.fetchPrice(token);
//
//        (string memory price, uint256 timestamp) = tokenPrice.tokenPrices(token);
//
//        assertEq(price, expectedPrice);
//        assertTrue(timestamp > 0);
//    }

    function testFetchPriceInBytesSequence() public {
        string memory price;
        bytes memory sequence = hex"00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000011323931392e353239373036373134313335000000000000000000000000000000";

        (price) = abi.decode(sequence, (string));
        assertEq(price, "2919.529706714135");
    }

//    function testThisShit() public {
//        string memory price;
//
//    bytes memory res = 0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000011333031352e363533333736363331373039000000000000000000000000000000;
//        (price) = abi.decode(res, (string));
//        console.log(price);
//        assertEq(price, '1000');
//    }
}
