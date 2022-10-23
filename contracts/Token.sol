pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor() ERC20("TestToken2", "TT2") {
        _mint(msg.sender, 2000000e18);
    }
}
