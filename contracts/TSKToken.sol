// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TSKToken
 * @dev ERC20 Token for the TSK Platform
 */
contract TSKToken is ERC20, ERC20Burnable, Ownable {
    // Max supply of 1 billion Taskium tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    // Events for tracking token distribution
    event TokensMinted(address indexed to, uint256 amount);
    event WithdrawalProcessed(address indexed user, uint256 amount);

    /**
     * @dev Constructor that gives the msg.sender all of the initial supply.
     */
    constructor(address initialOwner) 
        ERC20("Taskium Token", "TSK") 
        Ownable(initialOwner)
    {
        // Initial supply is 100 million tokens (10% of max supply)
        uint256 initialSupply = 100_000_000 * 10**18;
        _mint(initialOwner, initialSupply);
    }

    /**
     * @dev Function to mint tokens, restricted to the owner.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint in wei.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "TSK: Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Process a withdrawal from the platform
     * @param user Address receiving the tokens
     * @param amount Amount to transfer
     */
    function processWithdrawal(address user, uint256 amount) public onlyOwner {
        require(balanceOf(address(this)) >= amount, "TSK: Insufficient balance for withdrawal");
        _transfer(address(this), user, amount);
        emit WithdrawalProcessed(user, amount);
    }

    /**
     * @dev Function to process multiple withdrawals in a batch
     * @param users Array of addresses to receive tokens
     * @param amounts Array of token amounts to transfer
     */
    function batchProcessWithdrawals(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(users.length == amounts.length, "TSK: Arrays length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            processWithdrawal(users[i], amounts[i]);
        }
    }
}