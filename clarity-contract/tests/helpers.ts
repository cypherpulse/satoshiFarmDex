declare const simnet: any;

export const deployer = simnet.deployer;
export const alice = simnet.getAccounts().get("wallet_1")!;
export const bob = simnet.getAccounts().get("wallet_2")!;