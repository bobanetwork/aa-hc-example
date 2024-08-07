// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../contracts/TokenPrice.sol";

contract MockHybridAccount {
    function CallOffchain(
        bytes32,
        bytes memory
    ) public pure returns (uint32, bytes memory) {
        return (0, abi.encode("2000.50"));
    }
}

contract TokenPriceTest is Test {
    TokenPrice public tokenPrice;
    MockHybridAccount public mockHA;

    event FetchPriceError(uint32 err);
    event FetchPriceRet(bytes err);

    function setUp() public {
        mockHA = new MockHybridAccount();
        tokenPrice = new TokenPrice(payable(address(mockHA)));
    }

    function testFetchPrice() public {
        string memory token = "ETH";

        vm.mockCall(
            address(mockHA),
            abi.encodeWithSelector(MockHybridAccount.CallOffchain.selector),
            abi.encode(uint32(0), abi.encode("2000.50"))
        );

        uint256 timestampBefore = block.timestamp;
        tokenPrice.fetchPrice(token);

        (string memory price, uint256 timestamp) = tokenPrice.tokenPrices(
            token
        );

        assertEq(price, "2000.50", "Price should be 2000.50");
        assertEq(
            timestamp,
            timestampBefore,
            "Timestamp should match the block timestamp when fetchPrice was called"
        );
    }

    function testFetchPriceError() public {
        string memory token = "INVALID";
        uint32 expectedErrorCode = 1;
        string memory errorMessage = "Price not available";

        vm.mockCall(
            address(mockHA),
            abi.encodeWithSelector(MockHybridAccount.CallOffchain.selector),
            abi.encode(expectedErrorCode, abi.encode(errorMessage))
        );

        vm.expectEmit(true, false, false, true);
        emit FetchPriceError(expectedErrorCode);

        vm.expectEmit(true, false, false, true);
        emit FetchPriceRet(abi.encode(errorMessage));

        vm.expectRevert();

        tokenPrice.fetchPrice(token);

        (string memory price, ) = tokenPrice.tokenPrices(token);
        assertEq(price, "", "Price should not be set on failure");
    }

    function testFetchPriceInBytesSequence() public pure {
        string memory price;
        bytes
            memory sequence = hex"00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000011323931392e353239373036373134313335000000000000000000000000000000";
        (price) = abi.decode(sequence, (string));
        assertEq(price, "2919.529706714135");
    }
}
