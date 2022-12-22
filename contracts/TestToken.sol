// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(uint256 totalSupply) ERC20("TestToken2", "TT2") {
        _mint(msg.sender, totalSupply);
    }
}
