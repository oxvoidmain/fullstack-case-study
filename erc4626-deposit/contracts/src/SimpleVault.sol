// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleVault
 * @dev ERC4626 Vault implementation based on OpenZeppelin ERC4626
 * @notice A simple vault that accepts USDC deposits and mints shares 1:1
 */
contract SimpleVault is ERC4626, Ownable {
    constructor(address asset) ERC4626(IERC20(asset)) ERC20("Simple Vault", "SV") Ownable(msg.sender) {}

    /**
     * @dev Override decimals to match the underlying asset (USDC = 6 decimals)
     * @return The number of decimals (6)
     */
    function decimals() public view virtual override returns (uint8) {
        return 6; // Match USDC decimals
    }

    /**
     * @dev Override maxDeposit to allow unlimited deposits for testing
     * @return The maximum amount that can be deposited
     */
    function maxDeposit(address /* receiver */) public view virtual override returns (uint256) {
        return type(uint256).max; // Allow unlimited deposits for testing
    }

    /**
     * @dev Override maxMint to allow unlimited minting for testing
     * @return The maximum amount of shares that can be minted
     */
    function maxMint(address /* receiver */) public view virtual override returns (uint256) {
        return type(uint256).max; // Allow unlimited minting for testing
    }

    /**
     * @dev Override previewDeposit to return 1:1 ratio for simplicity
     * @param assets The amount of assets to deposit
     * @return The amount of shares that would be minted
     */
    function previewDeposit(uint256 assets) public view virtual override returns (uint256) {
        return assets; // 1:1 ratio for simplicity
    }

    /**
     * @dev Override previewMint to return 1:1 ratio for simplicity
     * @param shares The amount of shares to mint
     * @return The amount of assets required
     */
    function previewMint(uint256 shares) public view virtual override returns (uint256) {
        return shares; // 1:1 ratio for simplicity
    }

    /**
     * @dev Override convertToShares to return 1:1 ratio for simplicity
     * @param assets The amount of assets to convert
     * @return The amount of shares
     */
    function convertToShares(uint256 assets) public view virtual override returns (uint256) {
        return assets; // 1:1 ratio for simplicity
    }

    /**
     * @dev Override convertToAssets to return 1:1 ratio for simplicity
     * @param shares The amount of shares to convert
     * @return The amount of assets
     */
    function convertToAssets(uint256 shares) public view virtual override returns (uint256) {
        return shares; // 1:1 ratio for simplicity
    }

    /**
     * @dev Emergency function to withdraw all assets (only owner)
     * @notice This is for testing purposes only
     */
    function emergencyWithdraw() external onlyOwner {
        IERC20 assetToken = IERC20(asset());
        uint256 balance = assetToken.balanceOf(address(this));
        if (balance > 0) {
            require(assetToken.transfer(owner(), balance), "Transfer failed");
        }
    }
}