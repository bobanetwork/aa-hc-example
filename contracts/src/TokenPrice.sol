// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./samples/HybridAccount.sol";

contract TokenPrice {
    mapping(string => TokenPriceStruct) public tokenPrices;
    address payable immutable helperAddr;

    struct TokenPriceStruct {
        string price;
        uint256 timestamp;
    }

    constructor(address payable _helperAddr) {
        helperAddr = _helperAddr;
    }

    function fetchPrice(string calldata token) public {
        HybridAccount ha = HybridAccount(payable(helperAddr));
        string memory price;

        bytes memory req = abi.encodeWithSignature("getprice(string)", token);
        bytes32 userKey = bytes32(abi.encode(msg.sender));
        (uint32 error, bytes memory ret) = ha.CallOffchain(userKey, req);

        if (error != 0) {
            revert(string(ret));
        }

        (price) = abi.decode(ret, (string));
        tokenPrices[token] = TokenPriceStruct({
            price: price,
            timestamp: block.timestamp
        });
    }
}