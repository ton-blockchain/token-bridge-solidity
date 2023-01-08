// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestWrappedJetton is ERC20 {
    constructor() ERC20("TestWrappedJetton", "TWJ") {
        _mint(msg.sender, 2000000e18);
    }

    function isWrappedJetton() external pure returns (bool) {
        return true;
    }
}
