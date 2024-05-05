// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestMATIC is ERC20 {
    constructor() ERC20("Test MATIC", "tMATIC") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
