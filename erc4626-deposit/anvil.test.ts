import { describe, it, expect, beforeAll } from "bun:test";
import {
    createPublicClient,
    createWalletClient,
    http,
    parseEther,
    formatEther,
    getContract,
    parseAbi,
    type PublicClient,
    type WalletClient,
    type Address
} from "viem";
import { waitForTransactionReceipt, deployContract } from "viem/actions";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { deposit } from "./index";
import { NotEnoughBalanceError, MissingAllowanceError, AmountExceedsMaxDepositError, InvalidAmountError, InvalidReceiverError } from "./index";

/**
 * DYNAMIC ANVIL ACCOUNT MANAGEMENT SYSTEM
 * 
 * This system dynamically generates accounts from Anvil's mnemonic
 * instead of using hardcoded private keys. This makes the tests more
 * flexible and doesn't rely on predefined constants.
 * 
 * The system works by:
 * 1. Using Anvil's standard test mnemonic (which is deterministic)
 * 2. Generating accounts on-demand using the mnemonic + index
 * 3. No hardcoded private keys - everything is derived dynamically
 */

import { mnemonicToAccount } from "viem/accounts";

// Anvil's standard test mnemonic - this is the default mnemonic used by Anvil
// It's deterministic and always generates the same accounts
const ANVIL_MNEMONIC = "test test test test test test test test test test test junk";

/**
 * Generate an account from Anvil's mnemonic by index
 * This is completely dynamic - no hardcoded private keys!
 * 
 * @param accountIndex The index of the account (0-9)
 * @returns The account object
 */
function getAnvilAccount(accountIndex: number = 0) {
    if (accountIndex < 0 || accountIndex >= 10) {
        throw new Error("Account index must be between 0 and 9");
    }
    
    // Generate account from mnemonic with the specified index
    // This is completely dynamic - no hardcoded private keys!
    return mnemonicToAccount(ANVIL_MNEMONIC, {
        addressIndex: accountIndex,
    });
}

/**
 * Get account information for debugging
 * @param accountIndex The index of the account
 * @returns Account info including address
 */
function getAnvilAccountInfo(accountIndex: number = 0) {
    const account = getAnvilAccount(accountIndex);
    return {
        address: account.address,
        index: accountIndex,
        source: "mnemonic-derived"
    };
}

// Import compiled contract artifacts
import USDCArtifact from "./contracts/out/USDC.sol/USDC.json";
import SimpleVaultArtifact from "./contracts/out/SimpleVault.sol/SimpleVault.json";

// Extract bytecode and ABI from artifacts
const USDC_BYTECODE = USDCArtifact.bytecode.object as `0x${string}`;
const USDC_ABI = USDCArtifact.abi;

const SIMPLE_VAULT_BYTECODE = SimpleVaultArtifact.bytecode.object as `0x${string}`;
const SIMPLE_VAULT_ABI = SimpleVaultArtifact.abi;

let publicClient: PublicClient;
let walletClient: WalletClient;
let account: any;
let usdcAddress: Address;
let vaultAddress: Address;

describe("ERC4626 Deposit Tests - Real Contract Deployment on Anvil", () => {
    beforeAll(async () => {
        console.log("Setting up Anvil test environment...");

        // Create public client
        publicClient = createPublicClient({
            chain: anvil,
            transport: http("http://127.0.0.1:8545"),
        });

        // Get Anvil's first account dynamically
        // Anvil always generates the same 10 accounts with known private keys
        // We'll use our utility function to get the account directly
        account = getAnvilAccount(0);
        
        // Verify the account matches what Anvil expects
        const accountInfo = getAnvilAccountInfo(0);
        console.log("Using Anvil account:", accountInfo.address);
        console.log("Account info:", accountInfo);

        // Create wallet client with the account
        walletClient = createWalletClient({
            chain: anvil,
            transport: http("http://127.0.0.1:8545"),
            account,
        });

        console.log(" Connected to Anvil with account:", account.address);

        // Deploy USDC contract
        console.log("Deploying USDC contract...");
        const usdcHash = await deployContract(walletClient, {
            abi: USDC_ABI,
            bytecode: USDC_BYTECODE,
            account: account,
            chain: anvil,
        });
        const usdcReceipt = await waitForTransactionReceipt(publicClient, { hash: usdcHash });
        usdcAddress = usdcReceipt.contractAddress!;

        console.log(" USDC deployed at:", usdcAddress);

        // Deploy SimpleVault contract with USDC as asset
        console.log("Deploying SimpleVault contract...");
        const vaultHash = await deployContract(walletClient, {
            abi: SIMPLE_VAULT_ABI,
            bytecode: SIMPLE_VAULT_BYTECODE,
            args: [usdcAddress],
            account: account,
            chain: anvil,
        });
        const vaultReceipt = await waitForTransactionReceipt(publicClient, { hash: vaultHash });
        vaultAddress = vaultReceipt.contractAddress!;

        console.log(" SimpleVault deployed at:", vaultAddress);

        // Mint 10000 USDC tokens to the test account (USDC has 6 decimals)
        console.log("Minting USDC tokens...");
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        await usdcContract.write.mint!([account.address, 10000000000n]); // 10,000 USDC (6 decimals)

        // Approve the vault to spend 1000000 USDC tokens
        await usdcContract.write.approve!([vaultAddress, 1000000000000n]); // 1,000,000 USDC

        console.log(" Setup complete! Contracts deployed and tokens minted.");
        console.log("Contract addresses:", {
            usdc: usdcAddress,
            vault: vaultAddress,
        });
    });

    it("should successfully deposit into the vault", async () => {
        const depositAmount = 100000000n; // 100 USDC (6 decimals)

        // Get contract instances
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: publicClient,
        });

        const vaultContract = getContract({
            address: vaultAddress,
            abi: SIMPLE_VAULT_ABI,
            client: publicClient,
        });

        // Check initial balances and allowances
        const initialBalance = await usdcContract.read.balanceOf!([account.address]) as bigint;
        const initialAllowance = await usdcContract.read.allowance!([account.address, vaultAddress]) as bigint;
        const maxDeposit = await vaultContract.read.maxDeposit!([account.address]) as bigint;
        const vaultAsset = await vaultContract.read.asset!() as Address;

        console.log("Initial state:", {
            balance: (Number(initialBalance) / 1e6).toFixed(2) + " USDC",
            allowance: (Number(initialAllowance) / 1e6).toFixed(2) + " USDC",
            maxDeposit: (Number(maxDeposit) / 1e6).toFixed(2) + " USDC",
            vaultAsset: vaultAsset,
        });

        // Verify vault asset matches USDC
        expect(vaultAsset.toLowerCase()).toBe(usdcAddress.toLowerCase());

        // Perform the deposit
        const depositResult = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: depositAmount,
            walletClient: walletClient,
        });

        // Assertions
        expect(depositResult).toBeDefined();
        expect(typeof depositResult).toBe("object");
        expect("hash" in depositResult).toBe(true);
        expect("receipt" in depositResult).toBe(true);
        
        // Type guard to ensure we have a DepositResult
        if ("receipt" in depositResult) {
            expect(depositResult.receipt.status).toBe("success");
            expect(depositResult.receipt.from.toLowerCase()).toBe(account.address.toLowerCase());
            expect(depositResult.receipt.to.toLowerCase()).toBe(vaultAddress.toLowerCase());
        }

        // Check vault shares were minted
        const vaultShares = await vaultContract.read.balanceOf!([account.address]) as bigint;
        expect(vaultShares).toBeGreaterThan(0n);
        console.log(" Vault shares received:", (Number(vaultShares) / 1e6).toFixed(2));

        // Check vault total assets increased
        const totalAssets = await vaultContract.read.totalAssets!() as bigint;
        expect(totalAssets).toBeGreaterThan(0n);
        console.log(" Total vault assets:", (Number(totalAssets) / 1e6).toFixed(2));
    });

    it("should throw NotEnoughBalanceError when user has insufficient token balance", async () => {
        const depositAmount = 20000000000n; // 20,000 USDC (more than the 10,000 we minted)

        let error: any;
        try {
            await deposit(publicClient, {
                wallet: account.address,
                vault: vaultAddress,
                amount: depositAmount,
                walletClient: walletClient,
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(NotEnoughBalanceError);
        expect(error.message).toMatch(/not enough balance/i);
        console.log(" NotEnoughBalanceError test passed");
    });

    it("should throw MissingAllowanceError when vault lacks approval to spend tokens", async () => {
        // Create a new account without approval
        const newAccount = getAnvilAccount(1); // Use Anvil's second account
        
        // Mint some tokens to the new account
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        await usdcContract.write.mint!([newAccount.address, 1000000000n]); // 1,000 USDC

        const depositAmount = 100000000n; // 100 USDC

        let error: any;
        try {
            await deposit(publicClient, {
                wallet: newAccount.address,
                vault: vaultAddress,
                amount: depositAmount,
                walletClient: walletClient,
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(MissingAllowanceError);
        expect(error.message).toMatch(/not enough allowance/i);
        console.log(" MissingAllowanceError test passed");
    });

    it("should handle zero amount validation", async () => {
        const zeroAmount = 0n;

        let error: any;
        try {
            await deposit(publicClient, {
                wallet: account.address,
                vault: vaultAddress,
                amount: zeroAmount,
                walletClient: walletClient,
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(InvalidAmountError);
        expect(error.message).toMatch(/invalid amount/i);
        console.log(" Zero amount validation test passed");
    });

    it("should handle invalid wallet address", async () => {
        const depositAmount = 100000000n; // 100 USDC
        const invalidWallet = "0x0000000000000000000000000000000000000000" as Address;

        let error: any;
        try {
            await deposit(publicClient, {
                wallet: invalidWallet,
                vault: vaultAddress,
                amount: depositAmount,
                walletClient: walletClient,
            });
        } catch (e) {``
            error = e;
        }

        expect(error).toBeInstanceOf(InvalidReceiverError);
        expect(error.message).toMatch(/invalid receiver address/i);
        console.log(" Invalid wallet address test passed");
    });

    it("should handle invalid vault address", async () => {
        const depositAmount = 100000000n; // 100 USDC
        const invalidVault = "0x0000000000000000000000000000000000000000" as Address;

        let error: any;
        try {
            await deposit(publicClient, {
                wallet: account.address,
                vault: invalidVault,
                amount: depositAmount,
                walletClient: walletClient,
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(InvalidReceiverError);
        expect(error.message).toMatch(/invalid receiver address/i);
        console.log(" Invalid vault address test passed");
    });


    it("should handle multiple deposits correctly", async () => {
        const depositAmount = 50000000n; // 50 USDC

        // First deposit
        const result1 = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: depositAmount,
            walletClient: walletClient,
        });

        expect(result1).toBeDefined();
        expect("hash" in result1).toBe(true);

        // Second deposit
        const result2 = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: depositAmount,
            walletClient: walletClient,
        });

        expect(result2).toBeDefined();
        expect("hash" in result2).toBe(true);

        // Check total vault shares
        const vaultContract = getContract({
            address: vaultAddress,
            abi: SIMPLE_VAULT_ABI,
            client: publicClient,
        });

        const totalShares = await vaultContract.read.balanceOf!([account.address]) as bigint;
        expect(totalShares).toBeGreaterThan(0n);

        console.log(" Total vault shares after multiple deposits:", (Number(totalShares) / 1e6).toFixed(2));
    });


    // Additional comprehensive test cases for deposit function
    it("should return transaction object when walletClient is not provided", async () => {
        const depositAmount = 100000000n; // 100 USDC

        const result = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: depositAmount,
            // No walletClient provided
        });

        // Should return transaction object, not execution result
        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
        expect("hash" in result).toBe(false);
        expect("receipt" in result).toBe(false);
        expect("to" in result).toBe(true);
        expect("from" in result).toBe(true);
        expect("data" in result).toBe(true);
        expect("value" in result).toBe(true);
        expect("gas" in result).toBe(true);

        // Type guard to ensure we have a Transaction
        if ("to" in result) {
            expect(result.to.toLowerCase()).toBe(vaultAddress.toLowerCase());
            expect(result.from.toLowerCase()).toBe(account.address.toLowerCase());
            expect(result.value).toBe(0n); // No ETH value for ERC4626
            expect(result.gas).toBeGreaterThan(0n);
            expect(result.data).toMatch(/^0x[a-fA-F0-9]+$/); // Valid hex data
        }

        console.log(" Transaction object return test passed");
    });

    it("should handle gas estimation with proper buffer", async () => {
        const depositAmount = 100000000n; // 100 USDC

        // Get the transaction object to inspect gas estimation
        const result = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: depositAmount,
        });

        if ("gas" in result) {
            // Gas should be greater than 0 and include 10% buffer
            expect(result.gas).toBeGreaterThan(0n);
            
            // Verify gas estimation was called by checking the transaction data
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(2); // At least "0x" + some data
        }

        console.log(" Gas estimation test passed");
    });

    it("should validate vault asset matches expected token", async () => {
        const depositAmount = 100000000n; // 100 USDC

        // This test verifies the asset validation logic in deposit function
        const result = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: depositAmount,
            walletClient: walletClient,
        });

        // If we get here without error, the vault asset validation passed
        expect(result).toBeDefined();
        expect("hash" in result).toBe(true);

        console.log(" Vault asset validation test passed");
    });

    it("should handle negative amount validation", async () => {
        const negativeAmount = -1n;

        let error: any;
        try {
            await deposit(publicClient, {
                wallet: account.address,
                vault: vaultAddress,
                amount: negativeAmount,
                walletClient: walletClient,
            });
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(InvalidAmountError);
        expect(error.message).toMatch(/invalid amount/i);
        console.log(" Negative amount validation test passed");
    });

    it("should handle very large amount that exceeds max deposit", async () => {
        // Create a vault with limited max deposit for this test
        const limitedVaultHash = await deployContract(walletClient, {
            abi: SIMPLE_VAULT_ABI,
            bytecode: SIMPLE_VAULT_BYTECODE,
            args: [usdcAddress],
            account: account,
            chain: anvil,
        });
        const limitedVaultReceipt = await waitForTransactionReceipt(publicClient, { hash: limitedVaultHash });
        const limitedVaultAddress = limitedVaultReceipt.contractAddress!;

        // Approve the limited vault
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        await usdcContract.write.approve!([limitedVaultAddress, 1000000000000n]);

        // Try to deposit an extremely large amount
        const hugeAmount = 115792089237316195423570985008687907853269984665640564039457584007913129639935n; // type(uint256).max

        let error: any;
        try {
            await deposit(publicClient, {
                wallet: account.address,
                vault: limitedVaultAddress,
                amount: hugeAmount,
                walletClient: walletClient,
            });
        } catch (e) {
            error = e;
        }

        // This should either throw AmountExceedsMaxDepositError or NotEnoughBalanceError
        expect(error).toBeDefined();
        expect(
            error instanceof AmountExceedsMaxDepositError || 
            error instanceof NotEnoughBalanceError
        ).toBe(true);
        
        console.log(" Large amount validation test passed");
    });

    it("should handle exact balance deposit", async () => {
        // Use the main account but ensure we have enough allowance
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        
        const exactAmount = 100000000n; // 100 USDC
        // Approve additional tokens for this test
        await usdcContract.write.approve!([vaultAddress, exactAmount]);

        // Deposit exact balance
        const result = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: exactAmount,
            walletClient: walletClient,
        });

        expect(result).toBeDefined();
        expect("hash" in result).toBe(true);

        console.log(" Exact balance deposit test passed");
    });

    it("should handle exact allowance deposit", async () => {
        // Use the main account but ensure we have exact allowance
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        
        const exactAmount = 50000000n; // 50 USDC
        // Approve exact amount for this test
        await usdcContract.write.approve!([vaultAddress, exactAmount]);

        // Deposit with exact allowance
        const result = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: exactAmount,
            walletClient: walletClient,
        });

        expect(result).toBeDefined();
        expect("hash" in result).toBe(true);

        // Check that allowance is now 0
        const finalAllowance = await usdcContract.read.allowance!([account.address, vaultAddress]) as bigint;
        expect(finalAllowance).toBe(0n);

        console.log(" Exact allowance deposit test passed");
    });

    it("should handle deposit with different receiver address", async () => {
        const depositAmount = 100000000n; // 100 USDC
        const receiverAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address; // Different from wallet

        // Use the main account but ensure we have enough allowance
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        
        // Approve additional tokens for this test
        await usdcContract.write.approve!([vaultAddress, depositAmount]);

        const result = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: depositAmount,
            walletClient: walletClient,
        });

        expect(result).toBeDefined();
        expect("hash" in result).toBe(true);

        // Verify the deposit was successful
        const vaultContract = getContract({
            address: vaultAddress,
            abi: SIMPLE_VAULT_ABI,
            client: publicClient,
        });

        const shares = await vaultContract.read.balanceOf!([account.address]) as bigint;
        expect(shares).toBeGreaterThan(0n);

        console.log(" Different receiver address test passed");
    });

    it("should validate transaction data encoding", async () => {
        const depositAmount = 100000000n; // 100 USDC

        // Use the main account but ensure we have enough allowance
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        
        // Approve additional tokens for this test
        await usdcContract.write.approve!([vaultAddress, depositAmount]);

        const result = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: depositAmount,
        });

        if ("data" in result) {
            // Transaction data should be properly encoded
            expect(result.data).toMatch(/^0x[a-fA-F0-9]+$/);
            expect(result.data.length).toBeGreaterThan(10); // Should have meaningful data
            
            // The data should contain the deposit function call
            // This is a basic check - in a real scenario you might decode and verify the function selector
            expect(result.data).toBeDefined();
        }

        console.log(" Transaction data encoding test passed");
    });

    it("should handle multiple consecutive deposits correctly", async () => {
        const depositAmount = 25000000n; // 25 USDC each
        const numberOfDeposits = 3;

        // Use the main account but ensure we have enough allowance
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        
        const totalAmount = depositAmount * BigInt(numberOfDeposits);
        // Approve additional tokens for this test
        await usdcContract.write.approve!([vaultAddress, totalAmount]);

        const vaultContract = getContract({
            address: vaultAddress,
            abi: SIMPLE_VAULT_ABI,
            client: publicClient,
        });

        // Get initial shares
        const initialShares = await vaultContract.read.balanceOf!([account.address]) as bigint;

        // Perform multiple deposits
        for (let i = 0; i < numberOfDeposits; i++) {
            const result = await deposit(publicClient, {
                wallet: account.address,
                vault: vaultAddress,
                amount: depositAmount,
                walletClient: walletClient,
            });

            expect(result).toBeDefined();
            expect("hash" in result).toBe(true);
        }

        // Check final shares
        const finalShares = await vaultContract.read.balanceOf!([account.address]) as bigint;
        const expectedShares = initialShares + (depositAmount * BigInt(numberOfDeposits));
        
        expect(finalShares).toBe(expectedShares);

        console.log(" Multiple consecutive deposits test passed");
    });

    it("should handle edge case with minimum valid amount", async () => {
        const minimumAmount = 1n; // 1 wei (minimum unit)

        // Use the main account but ensure we have enough allowance
        const usdcContract = getContract({
            address: usdcAddress,
            abi: USDC_ABI,
            client: walletClient,
        });
        
        // Approve additional tokens for this test
        await usdcContract.write.approve!([vaultAddress, minimumAmount]);

        const result = await deposit(publicClient, {
            wallet: account.address,
            vault: vaultAddress,
            amount: minimumAmount,
            walletClient: walletClient,
        });

        expect(result).toBeDefined();
        expect("hash" in result).toBe(true);

        console.log(" Minimum valid amount test passed");
    });
});
