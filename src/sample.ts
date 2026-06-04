export const SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IToken {
    function transfer(address to, uint256 amount) external returns (bool);
}

abstract contract Ownable {
    address public owner;
    event OwnershipTransferred(address indexed from, address indexed to);
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
}

contract Token is Ownable, IToken {
    string public name = "Sketch";
    mapping(address => uint256) public balanceOf;
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() { owner = msg.sender; }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}`
