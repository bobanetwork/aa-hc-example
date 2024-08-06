// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "forge-std/Test.sol";
import "../contracts/TokenPrice.sol";

contract MockHybridAccount {
    function CallOffchain(bytes32, bytes memory) public pure returns (uint32, bytes memory) {
        return (0, abi.encode("2000"));
    }
}

interface ITokenPrice {
    struct TokenPriceStruct {
        string price;
        uint256 timestamp;
    }
    event FetchPriceError(uint32 err);
    function tokenPrices(string memory) external view returns (TokenPriceStruct memory);
    function HA() external view returns (address);
    function fetchPrice(string calldata token) external;
}

/** @dev Unit tests */
contract TokenPriceTest is Test {
    ITokenPrice public tokenPrice;

    function setUp() public {
        tokenPrice = ITokenPrice(vm.envAddress("TOKEN_PRICE_CONTRACT"));
    }

    function testFetchPrice() view public {
        string memory token = "ETH";
        string memory expectedPrice = "2000";
        assertEq(tokenPrice.tokenPrices(token).price, expectedPrice);
    }

    function testFetchPriceInBytesSequence() pure public {
        string memory price;
        bytes memory sequence = hex"00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000011323931392e353239373036373134313335000000000000000000000000000000";
        (price) = abi.decode(sequence, (string));
        assertEq(price, "2919.529706714135");
    }
}
