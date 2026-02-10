import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { deployer, alice, bob } from "./helpers";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;

describe("SatoshiFarm - Integration Tests", () => {
  it("should handle complete marketplace workflow", () => {
    // 1. Multiple sellers list items
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Alice's Organic Apples"),
      Cl.stringAscii("Fresh from Alice's orchard"),
      Cl.uint(1500000), // 1.5 STX
      Cl.uint(20)
    ], alice);

    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Bob's Free-Range Eggs"),
      Cl.stringAscii("Farm fresh eggs"),
      Cl.uint(2000000), // 2 STX
      Cl.uint(12)
    ], bob);

    // 2. Buyers make purchases
    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(3)], deployer);
    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(2), Cl.uint(2)], deployer);

    // 3. Check earnings accumulation
    const { result: aliceEarnings } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(alice)], alice
    );
    expect(aliceEarnings).toBeUint(4500000); // 3 * 1.5 STX

    const { result: bobEarnings } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(bob)], bob
    );
    expect(bobEarnings).toBeUint(4000000); // 2 * 2 STX

    // 4. Sellers harvest earnings
    simnet.callPublicFn("satoshi-farm", "harvest-sats", [], alice);
    simnet.callPublicFn("satoshi-farm", "harvest-sats", [], bob);

    // 5. Verify earnings reset
    const { result: aliceAfterHarvest } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(alice)], alice
    );
    expect(aliceAfterHarvest).toBeUint(0);

    const { result: bobAfterHarvest } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(bob)], bob
    );
    expect(bobAfterHarvest).toBeUint(0);
  });

  it("should handle concurrent marketplace operations", () => {
    // Setup multiple items
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn("satoshi-farm", "list-item", [
        Cl.stringAscii(`Item ${i}`),
        Cl.stringAscii(`Description ${i}`),
        Cl.uint(i * 500000), // 0.5, 1.0, 1.5, 2.0, 2.5 STX
        Cl.uint(10)
      ], deployer);
    }

    // Multiple purchases from different buyers
    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(2)], alice);
    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(2), Cl.uint(1)], bob);
    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(3), Cl.uint(3)], alice);

    // Check total earnings
    const { result: earnings } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(deployer)], deployer
    );

    // Expected: (2 * 0.5) + (1 * 1.0) + (3 * 1.5) = 1.0 + 1.0 + 4.5 = 6.5 STX
    expect(earnings).toBeUint(6500000);

    // Check item quantities updated correctly
    const { result: item1 } = simnet.callReadOnlyFn("satoshi-farm", "get-item", [Cl.uint(1)], deployer);
    expect(item1).toBeSome(Cl.tuple({
      active: Cl.bool(true), quantity: Cl.uint(8), // 10 - 2
      name: Cl.stringAscii("Item 1"), price: Cl.uint(500000), seller: Cl.principal(deployer)
    }));

    const { result: item3 } = simnet.callReadOnlyFn("satoshi-farm", "get-item", [Cl.uint(3)], deployer);
    expect(item3).toBeSome(Cl.tuple({
      active: Cl.bool(true), quantity: Cl.uint(7), // 10 - 3
      name: Cl.stringAscii("Item 3"), price: Cl.uint(1500000), seller: Cl.principal(deployer)
    }));
  });

  it("should handle marketplace lifecycle: list → buy → sell out → harvest", () => {
    // List limited quantity item
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Rare Vintage Wine"),
      Cl.stringAscii("Limited edition bottle"),
      Cl.uint(50000000), // 50 STX
      Cl.uint(1) // Only 1 available
    ], deployer);

    // Check item is active
    const { result: beforePurchase } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-item", [Cl.uint(1)], deployer
    );
    expect(beforePurchase).toBeSome(Cl.tuple({
      active: Cl.bool(true), quantity: Cl.uint(1)
    }));

    // Purchase the only item
    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(1)], alice);

    // Check item becomes inactive (sold out)
    const { result: afterPurchase } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-item", [Cl.uint(1)], deployer
    );
    expect(afterPurchase).toBeSome(Cl.tuple({
      active: Cl.bool(false), quantity: Cl.uint(0)
    }));

    // Check earnings
    const { result: earnings } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(deployer)], deployer
    );
    expect(earnings).toBeUint(50000000);

    // Harvest earnings
    simnet.callPublicFn("satoshi-farm", "harvest-sats", [], deployer);

    // Verify earnings cleared
    const { result: afterHarvest } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(deployer)], deployer
    );
    expect(afterHarvest).toBeUint(0);
  });

  it("should handle bulk operations efficiently", () => {
    // List 10 items quickly
    for (let i = 1; i <= 10; i++) {
      simnet.callPublicFn("satoshi-farm", "list-item", [
        Cl.stringAscii(`Bulk Item ${i}`),
        Cl.stringAscii(`Bulk description ${i}`),
        Cl.uint(100000 * i), // Increasing prices
        Cl.uint(5)
      ], deployer);
    }

    // Verify all items listed
    const { result: nextId } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-next-item-id", [], deployer
    );
    expect(nextId).toBeUint(11); // Items 1-10 listed, next is 11

    // Bulk purchases
    for (let i = 1; i <= 5; i++) {
      simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(i), Cl.uint(1)], alice);
    }

    // Check earnings calculation
    const { result: earnings } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(deployer)], deployer
    );

    // Expected: 0.1 + 0.2 + 0.3 + 0.4 + 0.5 = 1.5 STX
    expect(earnings).toBeUint(1500000);
  });
});