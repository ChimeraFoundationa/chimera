// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 public myNumber;

    constructor(uint256 _initialNumber) {
        myNumber = _initialNumber;
    }

    function setNumber(uint256 _newNumber) public {
        myNumber = _newNumber;
    }
}
