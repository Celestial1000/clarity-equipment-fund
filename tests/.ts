import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can join fund with initial deposit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('equipment-fund', 'join-fund', [types.uint(1000)], wallet1.address)
        ]);
        
        block.receipts[0].result.expectOk().expectBool(true);
        
        let fundCheck = chain.mineBlock([
            Tx.contractCall('equipment-fund', 'get-participant-contribution', [types.principal(wallet1.address)], wallet1.address)
        ]);
        
        assertEquals(fundCheck.receipts[0].result.expectOk(), types.uint(1000));
    }
});

Clarinet.test({
    name: "Only owner can register equipment",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('equipment-fund', 'register-equipment', 
                [types.ascii("Printer"), types.uint(500), types.uint(100)], 
                deployer.address
            ),
            Tx.contractCall('equipment-fund', 'register-equipment', 
                [types.ascii("Scanner"), types.uint(300), types.uint(100)], 
                wallet1.address
            )
        ]);
        
        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectErr(types.uint(100)); // err-owner-only
    }
});

Clarinet.test({
    name: "Can perform maintenance with sufficient funds",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('equipment-fund', 'join-fund', [types.uint(1000)], wallet1.address),
            Tx.contractCall('equipment-fund', 'register-equipment', 
                [types.ascii("Printer"), types.uint(500), types.uint(100)], 
                deployer.address
            ),
            Tx.contractCall('equipment-fund', 'perform-maintenance', [types.uint(0)], deployer.address)
        ]);
        
        block.receipts.map(receipt => receipt.result.expectOk());
        
        let fundCheck = chain.mineBlock([
            Tx.contractCall('equipment-fund', 'get-total-fund', [], deployer.address)
        ]);
        
        assertEquals(fundCheck.receipts[0].result.expectOk(), types.uint(500));
    }
});
