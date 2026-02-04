import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Counter } from "../target/types/counter";
import { SystemProgram } from "@solana/web3.js";
import {assert} from "chai"; 

describe("counter", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Counter as Program<Counter>;
  const counterKeyPair = anchor.web3.Keypair.generate(); 

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize()
      .accounts({
        counter: counterKeyPair.publicKey, 
        user: provider.wallet.publicKey,
      })
      .signers([counterKeyPair])
      .rpc();
    const counterAccount = await program.account.counter.fetch(counterKeyPair.publicKey); 
    assert.equal(counterAccount.count.toNumber(), 0); 
    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    console.log("Your transaction signature", tx);
  });

  it("Increment the counter", async () => {
    const tx = await program.methods.increment()
      .accounts({
        counter: counterKeyPair.publicKey, 
      })
      .signers([])
      .rpc();
    const counterAccount = await program.account.counter.fetch(counterKeyPair.publicKey);
    assert.equal(counterAccount.count.toNumber(), 1);
    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    console.log("counter:", counterAccount.count.toString());
  });

  it("Decrement the counter", async () => {
    const tx = await program.methods.decrement()
      .accounts({
        counter: counterKeyPair.publicKey, 
      })
      .rpc();
    const counterAccount = await program.account.counter.fetch(counterKeyPair.publicKey);
    assert.equal(counterAccount.count.toNumber(), 0);
    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    console.log("counter:", counterAccount.count.toString());
  });

  it("Reset: Authority can reset the counter", async () => {
    await program.methods.increment()
      .accounts({
        counter: counterKeyPair.publicKey,
      })
      .rpc();
    await program.methods.reset()
      .accounts({
        counter: counterKeyPair.publicKey,
      })
      .rpc();
    const counterAccount = await program.account.counter.fetch(counterKeyPair.publicKey);
    assert.equal(counterAccount.count.toNumber(), 0);
    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    console.log("counter after reset:", counterAccount.count.toString());
  });

  it("Non-authority cannot reset the counter", async () => {
    const nonAuthorityProviderKeyPair = anchor.web3.Keypair.generate();
    const nonAuthorityProvider = new anchor.AnchorProvider(
      provider.connection,
      new anchor.Wallet(nonAuthorityProviderKeyPair),
      anchor.AnchorProvider.defaultOptions(),
    );
    anchor.setProvider(nonAuthorityProvider);
    try{
      await program.methods.reset()
        .accounts({
          counter: counterKeyPair.publicKey,
        })
        .rpc();
    } catch (error) {
      assert.ok(error);
    }
  });
});
