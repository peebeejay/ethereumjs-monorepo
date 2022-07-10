import { keccak256 } from 'ethereum-cryptography/keccak'
import { CheckpointTrie } from './checkpoint'
import { Proof } from '../types'
import { isFalsy } from '@ethereumjs/util'

/**
 * You can create a secure Trie where the keys are automatically hashed
 * using **keccak256** by using `import { SecureTrie as Trie } from '@ethereumjs/trie'`.
 * It has the same methods and constructor as `Trie`.
 * @class SecureTrie
 * @extends Trie
 * @public
 */
export class SecureTrie extends CheckpointTrie {
  /**
   * Gets a value given a `key`
   * @param key - the key to search for
   * @returns A Promise that resolves to `Buffer` if a value was found or `null` if no value was found.
   */
  async get(key: Buffer): Promise<Buffer | null> {
    const hash = Buffer.from(keccak256(key))
    const value = await super.get(hash)
    return value
  }

  /**
   * Stores a given `value` at the given `key`.
   * For a falsey value, use the original key to avoid double hashing the key.
   * @param key
   * @param value
   */
  async put(key: Buffer, val: Buffer): Promise<void> {
    if (isFalsy(val) || val.toString() === '') {
      await this.del(key)
    } else {
      const hash = Buffer.from(keccak256(key))
      await super.put(hash, val)
    }
  }

  /**
   * Deletes a value given a `key`.
   * @param key
   */
  async del(key: Buffer): Promise<void> {
    const hash = Buffer.from(keccak256(key))
    await super.del(hash)
  }

  /**
   * prove has been renamed to {@link SecureTrie.createProof}.
   * @deprecated
   * @param trie
   * @param key
   */
  static async prove(trie: SecureTrie, key: Buffer): Promise<Proof> {
    return this.createProof(trie, key)
  }

  /**
   * Creates a proof that can be verified using {@link SecureTrie.verifyProof}.
   * @param trie
   * @param key
   */
  static createProof(trie: SecureTrie, key: Buffer): Promise<Proof> {
    const hash = Buffer.from(keccak256(key))
    return super.createProof(trie, hash)
  }

  /**
   * Verifies a proof.
   * @param rootHash
   * @param key
   * @param proof
   * @throws If proof is found to be invalid.
   * @returns The value from the key.
   */
  static async verifyProof(rootHash: Buffer, key: Buffer, proof: Proof): Promise<Buffer | null> {
    const hash = Buffer.from(keccak256(key))
    return super.verifyProof(rootHash, hash, proof)
  }

  /**
   * Verifies a range proof.
   */
  static verifyRangeProof(
    rootHash: Buffer,
    firstKey: Buffer | null,
    lastKey: Buffer | null,
    keys: Buffer[],
    values: Buffer[],
    proof: Buffer[] | null
  ): Promise<boolean> {
    return super.verifyRangeProof(
      rootHash,
      firstKey && Buffer.from(keccak256(firstKey)),
      lastKey && Buffer.from(keccak256(lastKey)),
      keys.map((k) => Buffer.from(keccak256(k))),
      values,
      proof
    )
  }

  /**
   * Returns a copy of the underlying trie with the interface of SecureTrie.
   * @param includeCheckpoints - If true and during a checkpoint, the copy will contain the checkpointing metadata and will use the same scratch as underlying db.
   */
  copy(includeCheckpoints = true): SecureTrie {
    const secureTrie = new SecureTrie({
      db: this.dbStorage.copy(),
      root: this.root,
      deleteFromDB: (this as any)._deleteFromDB,
    })
    if (includeCheckpoints && this.isCheckpoint) {
      secureTrie.db.checkpoints = [...this.db.checkpoints]
    }
    return secureTrie
  }
}
