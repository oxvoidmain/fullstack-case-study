import { createPublicClient, http, type Address } from "viem";
import { anvil } from "viem/chains";

/**
 * ANVIL UTILITIES
 * 
 * This module provides utilities to interact with Anvil's default accounts
 * without hardcoding private keys or addresses.
 */

export interface AnvilAccount {
    address: Address;
    index: number;
    balance: bigint;
    balanceInEth: number;
}

export class AnvilAccountManager {
    private publicClient: ReturnType<typeof createPublicClient>;

    constructor(rpcUrl: string = "http://127.0.0.1:8545") {
        this.publicClient = createPublicClient({
            chain: anvil,
            transport: http(rpcUrl),
        });
    }

    /**
     * Get all accounts from Anvil
     */
    async getAllAccounts(): Promise<Address[]> {
        try {
            const accounts = await this.publicClient.request({
                method: "eth_accounts",
                params: [],
            });
            return accounts as Address[];
        } catch (error) {
            throw new Error(`Failed to get accounts from Anvil: ${error}`);
        }
    }

    /**
     * Get account by index with balance information
     */
    async getAccount(index: number): Promise<AnvilAccount> {
        const accounts = await this.getAllAccounts();
        
        if (index < 0 || index >= accounts.length) {
            throw new Error(`Account index ${index} out of range. Available accounts: 0-${accounts.length - 1}`);
        }

        const address = accounts[index];
        const balance = await this.publicClient.getBalance({ address });

        return {
            address,
            index,
            balance,
            balanceInEth: Number(balance) / 1e18,
        };
    }

    /**
     * Get the first account (index 0) - the default account
     */
    async getDefaultAccount(): Promise<AnvilAccount> {
        return this.getAccount(0);
    }

    /**
     * Get multiple accounts by indices
     */
    async getAccounts(indices: number[]): Promise<AnvilAccount[]> {
        return Promise.all(indices.map(index => this.getAccount(index)));
    }

    /**
     * Get all accounts with their balances
     */
    async getAllAccountsWithBalances(): Promise<AnvilAccount[]> {
        const accounts = await this.getAllAccounts();
        return Promise.all(
            accounts.map(async (address, index) => {
                const balance = await this.publicClient.getBalance({ address });
                return {
                    address,
                    index,
                    balance,
                    balanceInEth: Number(balance) / 1e18,
                };
            })
        );
    }

    /**
     * Check if Anvil is running and accessible
     */
    async isAnvilRunning(): Promise<boolean> {
        try {
            await this.publicClient.getBlockNumber();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get Anvil network information
     */
    async getNetworkInfo() {
        const [blockNumber, chainId, accounts] = await Promise.all([
            this.publicClient.getBlockNumber(),
            this.publicClient.getChainId(),
            this.getAllAccounts(),
        ]);

        return {
            blockNumber,
            chainId,
            accountCount: accounts.length,
            accounts: accounts.slice(0, 3), // Show first 3 accounts
        };
    }
}

// Convenience functions
export async function getAnvilAccounts(rpcUrl?: string): Promise<Address[]> {
    const manager = new AnvilAccountManager(rpcUrl);
    return manager.getAllAccounts();
}

export async function getAnvilAccount(index: number, rpcUrl?: string): Promise<AnvilAccount> {
    const manager = new AnvilAccountManager(rpcUrl);
    return manager.getAccount(index);
}

export async function getDefaultAnvilAccount(rpcUrl?: string): Promise<AnvilAccount> {
    const manager = new AnvilAccountManager(rpcUrl);
    return manager.getDefaultAccount();
}

// Example usage
if (import.meta.main) {
    const manager = new AnvilAccountManager();
    
    try {
        console.log("🔍 Anvil Account Information:");
        console.log("================================");
        
        // Check if Anvil is running
        const isRunning = await manager.isAnvilRunning();
        console.log(`Anvil Status: ${isRunning ? "✅ Running" : "❌ Not Running"}`);
        
        if (isRunning) {
            // Get network info
            const networkInfo = await manager.getNetworkInfo();
            console.log("\n📊 Network Information:");
            console.log(`Block Number: ${networkInfo.blockNumber}`);
            console.log(`Chain ID: ${networkInfo.chainId}`);
            console.log(`Account Count: ${networkInfo.accountCount}`);
            console.log(`First 3 Accounts: ${networkInfo.accounts.join(", ")}`);
            
            // Get default account
            const defaultAccount = await manager.getDefaultAccount();
            console.log("\n👤 Default Account (Index 0):");
            console.log(`Address: ${defaultAccount.address}`);
            console.log(`Balance: ${defaultAccount.balanceInEth.toFixed(4)} ETH`);
            
            // Get first 3 accounts
            const firstThreeAccounts = await manager.getAccounts([0, 1, 2]);
            console.log("\n👥 First 3 Accounts:");
            firstThreeAccounts.forEach(account => {
                console.log(`${account.index}: ${account.address} (${account.balanceInEth.toFixed(4)} ETH)`);
            });
        }
    } catch (error) {
        console.error("❌ Error:", error);
    }
}
