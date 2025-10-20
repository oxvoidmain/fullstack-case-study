import type { PublicClient, WalletClient } from "viem";
import { erc20Abi, erc4626Abi, getContract, encodeFunctionData } from "viem";

export type DepositParams = {
    wallet: `0x${string}`;
    vault: `0x${string}`;
    amount: bigint;
    walletClient?: WalletClient; // Optional wallet client for transaction execution
};

type Transaction = {
    data: `0x${string}`;
    from: `0x${string}`;
    to: `0x${string}`;
    value: bigint;
    gas: bigint;
};

type DepositResult = {
    hash: `0x${string}`;
    receipt: any; // Transaction receipt from waitForTransactionReceipt
};

export class NotEnoughBalanceError extends Error {
    constructor() {
        super("Not enough balance");
    }
}

export class MissingAllowanceError extends Error {
    constructor() {
        super("Not enough allowance");
    }
}

export class AmountExceedsMaxDepositError extends Error {
    constructor() {
        super("Amount exceeds max deposit");
    }
}

export class InvalidAmountError extends Error {
    constructor() {
        super("Invalid amount");
    }
}

export class InvalidReceiverError extends Error {
    constructor() {
        super("Invalid receiver address");
    }
}


/**
 * Deposit an amount of an asset into a given vault.
 *
 * @throws {NotEnoughBalanceError} if the wallet does not have enough balance to deposit the amount
 * @throws {MissingAllowanceError} if the wallet does not have enough allowance to deposit the amount
 * @throws {AmountExceedsMaxDepositError} if the amount exceeds the max deposit
 */
export async function deposit(
    client: PublicClient,
    { wallet, vault, amount, walletClient }: DepositParams,
): Promise<Transaction | DepositResult> {
    // Input validation
    if (amount <= 0n) {
        throw new InvalidAmountError();
    }

    if (wallet === "0x0000000000000000000000000000000000000000") {
        throw new InvalidReceiverError();
    }

    if (vault === "0x0000000000000000000000000000000000000000") {
        throw new InvalidReceiverError();
    }

    const vaultContract = getContract({
        address: vault,
        abi: erc4626Abi,
        client,
    });

    const asset = await vaultContract.read.asset();

    const assetContract = getContract({
        address: asset,
        abi: erc20Abi,
        client,
    });

    const balance = await assetContract.read.balanceOf([wallet]);

    if (balance < amount) {
        throw new NotEnoughBalanceError();
    }

    const allowance = await assetContract.read.allowance([wallet, vault]);

    if (allowance < amount) {
        throw new MissingAllowanceError();
    }

    const maxDeposit = await vaultContract.read.maxDeposit([wallet]);

    if (maxDeposit < amount) {
        throw new AmountExceedsMaxDepositError();
    }

    const gasEstimate = await client.estimateGas({
        account: wallet,
        to: vault,
        data: encodeFunctionData({
            abi: erc4626Abi,
            functionName: "deposit",
            args: [amount, wallet],
        }),
    });

    const depositTx = {
        to: vault,
        from: wallet,
        data: encodeFunctionData({
            abi: erc4626Abi,
            functionName: "deposit",
            args: [amount, wallet],
        }),
        value: 0n, // No ETH value needed for ERC-4626 deposit
        gas: gasEstimate + (gasEstimate * 10n / 100n), // 10% buffer
    };

    // If walletClient is provided, execute the transaction
    if (walletClient) {
        const hash = await walletClient.sendTransaction({
            ...depositTx,
            account: wallet,
            chain: null, // Use default chain
        });

        // Wait for transaction receipt
        const receipt = await client.waitForTransactionReceipt({ hash });

        return {
            hash,
            receipt,
        };
    }

    // Otherwise, return the transaction object
    return depositTx;
}
