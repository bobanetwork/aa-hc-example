// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "./samples/HybridAccount.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenPrice is Ownable {
    mapping(string => TokenPriceStruct) public tokenPrices;
    HybridAccount public HA;

    event FetchPriceError(uint32 err);
    event FetchPriceRet(bytes err);

    struct TokenPriceStruct {
        string price;
        uint256 timestamp; // Timestamp of when the price was fetched.
    }

    constructor(
        address _hybridAccount
    ) Ownable() {
        HA = HybridAccount(payable(_hybridAccount));
    }

    function fetchPrice(string calldata token) public {
        string memory price;

        // Encode function signature, which is called on the offchain rpc server.
        bytes memory req = abi.encodeWithSignature("getprice(string)", token);
        bytes32 userKey = bytes32(abi.encode(msg.sender));
        (uint32 error, bytes memory ret) = HA.CallOffchain(userKey, req);

        if (error != 0) {
            emit FetchPriceError(error);
            emit FetchPriceRet(ret);
            revert(string(ret));
        }

        // Decode price, which was encoded as a string on the offchain rpc server.
        (price) = abi.decode(ret, (string));
        tokenPrices[token] = TokenPriceStruct({
            price: price,
            timestamp: block.timestamp
        });
    }
}
