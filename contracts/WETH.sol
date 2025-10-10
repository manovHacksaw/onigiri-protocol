// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Wrapped ETH (WETH) for U2U Solaris
 * @dev A custom ERC20 token that represents wrapped ETH on U2U Solaris
 * This contract allows bridging ETH from Sepolia to U2U as WETH
 */
contract WETH is ERC20, Ownable {
    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);
    event BridgeMint(address indexed to, uint256 amount, bytes32 indexed transferId);

    // Bridge contract that can mint tokens
    address public bridge;
    
    // Mapping to track bridged amounts for potential future unwrapping
    mapping(bytes32 => uint256) public bridgedAmounts;

    constructor() ERC20("Wrapped ETH", "WETH") Ownable(msg.sender) {
        // Initial supply is 0, tokens are minted when bridging from Sepolia
    }

    /**
     * @dev Set the bridge contract address (only owner)
     * @param _bridge The address of the bridge contract
     */
    function setBridge(address _bridge) external onlyOwner {
        bridge = _bridge;
    }

    /**
     * @dev Mint WETH tokens when bridging from Sepolia
     * @param to The address to mint tokens to
     * @param amount The amount of WETH to mint
     * @param transferId The unique transfer ID from the bridge
     */
    function bridgeMint(address to, uint256 amount, bytes32 transferId) external {
        require(msg.sender == bridge, "WETH: Only bridge can mint");
        require(to != address(0), "WETH: Cannot mint to zero address");
        require(amount > 0, "WETH: Amount must be greater than 0");
        
        // Track the bridged amount
        bridgedAmounts[transferId] = amount;
        
        // Mint the tokens
        _mint(to, amount);
        
        emit BridgeMint(to, amount, transferId);
    }

    /**
     * @dev Burn WETH tokens (for potential future unwrapping back to ETH)
     * @param amount The amount of WETH to burn
     */
    function burn(uint256 amount) external {
        require(amount > 0, "WETH: Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "WETH: Insufficient balance");
        
        _burn(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @dev Get the total supply of WETH
     * @return The total supply
     */
    function totalSupply() public view override returns (uint256) {
        return super.totalSupply();
    }

    /**
     * @dev Get the balance of an account
     * @param account The account to check
     * @return The balance
     */
    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account);
    }

    /**
     * @dev Transfer tokens (standard ERC20)
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return Success status
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        return super.transfer(to, amount);
    }

    /**
     * @dev Transfer tokens from one address to another (standard ERC20)
     * @param from The sender address
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return Success status
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Approve spender (standard ERC20)
     * @param spender The spender address
     * @param amount The amount to approve
     * @return Success status
     */
    function approve(address spender, uint256 amount) public override returns (bool) {
        return super.approve(spender, amount);
    }

    /**
     * @dev Get allowance (standard ERC20)
     * @param owner The owner address
     * @param spender The spender address
     * @return The allowance
     */
    function allowance(address owner, address spender) public view override returns (uint256) {
        return super.allowance(owner, spender);
    }

    /**
     * @dev Emergency function to mint tokens (only owner, for testing)
     * @param to The address to mint to
     * @param amount The amount to mint
     */
    function emergencyMint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "WETH: Cannot mint to zero address");
        require(amount > 0, "WETH: Amount must be greater than 0");
        
        _mint(to, amount);
    }
}
