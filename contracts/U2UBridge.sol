// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./WETH.sol";

/**
 * @title U2U Bridge Contract
 * @dev Handles bridging ETH from Sepolia to WETH on U2U Solaris
 */
contract U2UBridge is Ownable {
    event CrossChainTransfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 destinationChainId,
        bytes32 transferId
    );

    event WETHMinted(
        address indexed to,
        uint256 amount,
        bytes32 indexed transferId
    );

    // WETH contract address
    WETH public weth;
    
    // Relayer address that can mint WETH
    address public relayer;
    
    // Mapping to track processed transfers
    mapping(bytes32 => bool) public processedTransfers;

    constructor(address _wethAddress, address _relayer) Ownable(msg.sender) {
        weth = WETH(_wethAddress);
        relayer = _relayer;
    }

    /**
     * @dev Bridge ETH from Sepolia (this function is called on Sepolia)
     * @param destinationChainId The destination chain ID (U2U = 39)
     * @param to The recipient address on U2U
     */
    function bridge(uint256 destinationChainId, address to) public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid recipient address");
        require(destinationChainId == 39, "Invalid destination chain");
        
        bytes32 transferId = keccak256(abi.encodePacked(
            msg.sender, 
            to, 
            msg.value, 
            destinationChainId, 
            block.timestamp,
            block.number
        ));
        
        emit CrossChainTransfer(msg.sender, to, msg.value, destinationChainId, transferId);
    }

    /**
     * @dev Mint WETH on U2U when relayer confirms the bridge
     * @param to The recipient address
     * @param amount The amount of WETH to mint
     * @param transferId The transfer ID from the bridge event
     */
    function mintWETH(address to, uint256 amount, bytes32 transferId) external {
        require(msg.sender == relayer, "Only relayer can mint WETH");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(!processedTransfers[transferId], "Transfer already processed");
        
        // Mark transfer as processed
        processedTransfers[transferId] = true;
        
        // Mint WETH tokens
        weth.bridgeMint(to, amount, transferId);
        
        emit WETHMinted(to, amount, transferId);
    }

    /**
     * @dev Set the relayer address (only owner)
     * @param _relayer The new relayer address
     */
    function setRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "Invalid relayer address");
        relayer = _relayer;
    }

    /**
     * @dev Set the WETH contract address (only owner)
     * @param _wethAddress The new WETH contract address
     */
    function setWETH(address _wethAddress) external onlyOwner {
        require(_wethAddress != address(0), "Invalid WETH address");
        weth = WETH(_wethAddress);
    }

    /**
     * @dev Withdraw ETH from the bridge (only owner)
     * @param amount The amount to withdraw
     */
    function withdrawETH(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    /**
     * @dev Get the bridge balance
     * @return The ETH balance of the bridge
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Check if a transfer has been processed
     * @param transferId The transfer ID to check
     * @return Whether the transfer has been processed
     */
    function isTransferProcessed(bytes32 transferId) external view returns (bool) {
        return processedTransfers[transferId];
    }
}