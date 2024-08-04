// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "./samples/HybridAccount.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenPrice is ERC20, Ownable {
    mapping(string => TokenPriceStruct) public tokenPrices;
    HybridAccount public HA;

    event FetchPriceError(uint32 err);
    event FetchPriceRet(bytes err);

    struct TokenPriceStruct {
        string price;
        uint256 timestamp;
    }

    constructor(
        address payable _demoAddr
    ) ERC20("TokenPrice Token", "TPT") Ownable() {
        address payable demoAddr = payable(_demoAddr);
        HA = HybridAccount(demoAddr);
    }

    function fetchPrice(string calldata token) public {
        string memory price;

        bytes memory req = abi.encodeWithSignature("getprice(string)", token);
        bytes32 userKey = bytes32(abi.encode(msg.sender));
        (uint32 error, bytes memory ret) = HA.CallOffchain(userKey, req);

        if (error != 0) {
            tokenPrices[token] = TokenPriceStruct({
                price: 'ERROR',
                timestamp: block.timestamp
            });
            emit FetchPriceError(error);
            emit FetchPriceRet(ret);
            revert(string(ret));
        }

        (price) = abi.decode(ret, (string));
        tokenPrices[token] = TokenPriceStruct({
            price: price,
            timestamp: block.timestamp
        });
    }
}
