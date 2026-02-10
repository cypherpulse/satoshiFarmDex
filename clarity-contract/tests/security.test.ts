import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { deployer, alice, bob } from "./helpers";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;

describe("SatoshiFarm - Security Tests", () => {
  it("should prevent unauthorized harvesting of earnings", () => {
    // Alice lists and sells an item
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Alice's Product"),
      Cl.stringAscii("Premium quality"),
      Cl.uint(1000000),
      Cl.uint(5)
    ], alice);

    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(2)], deployer);

    // Alice has earnings
    const { result: aliceEarnings } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(alice)], alice
    );
    expect(aliceEarnings).toBeUint(2000000);

    // Bob tries to harvest Alice's earnings - should fail
    const { result: unauthorizedHarvest } = simnet.callPublicFn(
      "satoshi-farm", "harvest-sats", [], bob
    );
    expect(unauthorizedHarvest).toBeErr(Cl.uint(104)); // err-not-authorized

    // Alice can harvest her own earnings
    const { result: authorizedHarvest } = simnet.callPublicFn(
      "satoshi-farm", "harvest-sats", [], alice
    );
    expect(authorizedHarvest).toBeOk(Cl.bool(true));
  });

  it("should validate item ownership for purchases", () => {
    // Alice lists an item
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Alice's Exclusive Item"),
      Cl.stringAscii("One of a kind"),
      Cl.uint(10000000),
      Cl.uint(1)
    ], alice);

    // Bob tries to buy Alice's item - should succeed (anyone can buy)
    const { result: purchaseResult } = simnet.callPublicFn(
      "satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(1)], bob
    );
    expect(purchaseResult).toBeOk(Cl.bool(true));

    // Item should be sold out
    const { result: itemAfterPurchase } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-item", [Cl.uint(1)], deployer
    );
    expect(itemAfterPurchase).toBeSome(Cl.tuple({
      active: Cl.bool(false), quantity: Cl.uint(0)
    }));
  });

  it("should prevent purchasing inactive items", () => {
    // List and sell out an item
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Limited Edition"),
      Cl.stringAscii("Very rare"),
      Cl.uint(5000000),
      Cl.uint(1)
    ], deployer);

    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(1)], alice);

    // Try to buy the sold out item - should fail
    const { result: invalidPurchase } = simnet.callPublicFn(
      "satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(1)], bob
    );
    expect(invalidPurchase).toBeErr(Cl.uint(102)); // err-item-inactive
  });

  it("should prevent purchasing more than available quantity", () => {
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Bulk Product"),
      Cl.stringAscii("Available in limited quantity"),
      Cl.uint(1000000),
      Cl.uint(3) // Only 3 available
    ], deployer);

    // Try to buy more than available - should fail
    const { result: overPurchase } = simnet.callPublicFn(
      "satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(5)], alice
    );
    expect(overPurchase).toBeErr(Cl.uint(103)); // err-insufficient-quantity
  });

  it("should validate input parameters", () => {
    // Test empty name
    const { result: emptyName } = simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii(""),
      Cl.stringAscii("Valid description"),
      Cl.uint(1000000),
      Cl.uint(1)
    ], deployer);
    expect(emptyName).toBeErr(Cl.uint(100)); // err-invalid-input

    // Test zero price
    const { result: zeroPrice } = simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Valid Name"),
      Cl.stringAscii("Valid description"),
      Cl.uint(0),
      Cl.uint(1)
    ], deployer);
    expect(zeroPrice).toBeErr(Cl.uint(100)); // err-invalid-input

    // Test zero quantity
    const { result: zeroQuantity } = simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Valid Name"),
      Cl.stringAscii("Valid description"),
      Cl.uint(1000000),
      Cl.uint(0)
    ], deployer);
    expect(zeroQuantity).toBeErr(Cl.uint(100)); // err-invalid-input
  });

  it("should prevent invalid item ID access", () => {
    // Try to get non-existent item
    const { result: invalidItem } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-item", [Cl.uint(999)], deployer
    );
    expect(invalidItem).toBeNone();

    // Try to buy non-existent item
    const { result: buyInvalid } = simnet.callPublicFn(
      "satoshi-farm", "buy-item", [Cl.uint(999), Cl.uint(1)], alice
    );
    expect(buyInvalid).toBeErr(Cl.uint(101)); // err-item-not-found
  });

  it("should handle STX transfer failures gracefully", () => {
    // List expensive item
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Expensive Item"),
      Cl.stringAscii("Costs more than buyer has"),
      Cl.uint(1000000000000), // 1 million STX - way more than available
      Cl.uint(1)
    ], deployer);

    // Try to buy with insufficient funds - should fail at STX transfer
    const { result: insufficientFunds } = simnet.callPublicFn(
      "satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(1)], alice
    );
    expect(insufficientFunds).toBeErr(Cl.uint(1)); // STX transfer failure
  });

  it("should maintain data integrity across operations", () => {
    // List item
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Integrity Test Item"),
      Cl.stringAscii("Testing data consistency"),
      Cl.uint(1000000),
      Cl.uint(10)
    ], deployer);

    // Get initial state
    const { result: initialItem } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-item", [Cl.uint(1)], deployer
    );

    // Make partial purchase
    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(3)], alice);

    // Verify data integrity
    const { result: afterPurchase } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-item", [Cl.uint(1)], deployer
    );

    // Item data should be consistent
    expect(afterPurchase).toBeSome(Cl.tuple({
      active: Cl.bool(true),
      quantity: Cl.uint(7), // 10 - 3
      name: Cl.stringAscii("Integrity Test Item"),
      price: Cl.uint(1000000),
      seller: Cl.principal(deployer)
    }));

    // Seller earnings should match
    const { result: earnings } = simnet.callReadOnlyFn(
      "satoshi-farm", "get-seller-sats", [Cl.principal(deployer)], deployer
    );
    expect(earnings).toBeUint(3000000); // 3 * 1 STX
  });

  it("should prevent double harvesting", () => {
    // Setup earnings
    simnet.callPublicFn("satoshi-farm", "list-item", [
      Cl.stringAscii("Harvest Test"),
      Cl.stringAscii("Testing harvest protection"),
      Cl.uint(1000000),
      Cl.uint(1)
    ], alice);

    simnet.callPublicFn("satoshi-farm", "buy-item", [Cl.uint(1), Cl.uint(1)], deployer);

    // First harvest should succeed
    const { result: firstHarvest } = simnet.callPublicFn(
      "satoshi-farm", "harvest-sats", [], alice
    );
    expect(firstHarvest).toBeOk(Cl.bool(true));

    // Second harvest should fail (no earnings left)
    const { result: secondHarvest } = simnet.callPublicFn(
      "satoshi-farm", "harvest-sats", [], alice
    );
    expect(secondHarvest).toBeErr(Cl.uint(105)); // err-no-earnings
  });
});