// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

contract TipJar {
    address public owner;

    event Tiprecv(address indexed tipper, uint256 amount);
    event TipWithDrawn(address indexed owner, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner can call this func.");
        _;
    }

    function tip() public payable {
        require(msg.value > 0, "You must send a tip to use this func.");
        emit Tiprecv(msg.sender, msg.value);
    }

    function withdrawTips() public onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "There are no tips to withdraw.");

        (bool success, ) = payable(owner).call{value: contractBalance}("");
        require(success, "Transfer failed.");
        emit TipWithDrawn(owner, contractBalance);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
