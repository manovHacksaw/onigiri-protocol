// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SepoliaBridge
 * @dev Bridge contract for Sepolia Testnet
 * @notice This contract handles ETH distribution on Sepolia side
 */
contract SepoliaBridge {
    event BridgeCompleted(
        address indexed recipient,
        uint256 amount,
        bytes32 indexed transferId,
        uint256 timestamp
    );

    address public owner;
    address public relayer;
    mapping(bytes32 => bool) public completedTransfers;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer can call this function");
        _;
    }

    constructor(address _relayer) {
        owner = msg.sender;
        relayer = _relayer;
    }

    /**
     * @dev Complete bridge - relayer calls this to send ETH to recipient
     * @param recipient Address to receive ETH
     * @param amount Amount of ETH to send
     * @param transferId Unique transfer identifier
     */
    function completeBridge(
        address recipient,
        uint256 amount,
        bytes32 transferId
    ) external onlyRelayer {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(!completedTransfers[transferId], "Transfer already completed");
        require(address(this).balance >= amount, "Insufficient contract balance");

        completedTransfers[transferId] = true;

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit BridgeCompleted(recipient, amount, transferId, block.timestamp);
    }

    /**
     * @dev Deposit ETH to this contract (for liquidity)
     */
    function deposit() external payable {
        require(msg.value > 0, "Amount must be greater than 0");
    }

    /**
     * @dev Set new relayer
     * @param newRelayer Address of new relayer
     */
    function setRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "Invalid relayer address");
        relayer = newRelayer;
    }

    /**
     * @dev Withdraw function for owner (emergency use)
     */
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Check if transfer is completed
     */
    function isTransferCompleted(bytes32 transferId) external view returns (bool) {
        return completedTransfers[transferId];
    }
}
