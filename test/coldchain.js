const { expectEvent, BN } = require("@openzeppelin/test-helpers");
const { assertion } = require("@openzeppelin/test-helpers/src/expectRevert");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");

const ColdChain = artifacts.require("ColdChain");

contract('ColdChain', (accounts) => {

  before(async () => {
    this.owner = accounts[0];

    this.VACCINE_BRANDS = {
      Pfizer: "Pfizer-BioNTech",
      Moderna: "Moderna",
      Janssen: "Johnson & Johnson's Janssen",
      Sputnik: "Sputnik V"
    };

    // enums
    this.ModeEnums = {
      ISSUER: { val: "ISSUER", pos: 0 },
      PROVER: { val: "PROVER", pos: 1 },
      VERIFIER: { val: "VERIFIER", pos: 2 }
    };

    this.StatusEnums = {
      manufactured: { val: "MANUFACTURED", pos: 0 },
      delivering: { val: "DELIVERING_INTERNATIONAL", pos: 1 },
      stored: { val: "STORED", pos: 2 },
      deliveringLocal: { val: "DELIVERING_LOCAL", pos: 3 },
      delivered: { val: "DELIVERED", pos: 4 }
    };

    this.defaultEntities = {
      manufacturerA: { id: accounts[1], mode: this.ModeEnums.PROVER.val },
      manufacturerB: { id: accounts[2], mode: this.ModeEnums.PROVER.val },
      inspector: { id: accounts[3], mode: this.ModeEnums.ISSUER.val },
      distributorGlobal: { id: accounts[4], mode: this.ModeEnums.VERIFIER.val },
      distributorLocal: { id: accounts[5], mode: this.ModeEnums.VERIFIER.val },
      immunizer: { id: accounts[6], mode: this.ModeEnums.ISSUER.val },
      traveler: { id: accounts[7], mode: this.ModeEnums.PROVER.val },
      borderAgent: { id: accounts[8], mode: this.ModeEnums.VERIFIER.val }
    };

    this.defaultVaccineBatches = {
      0: { brand: this.VACCINE_BRANDS.Pfizer, manufacturer: this.defaultEntities.manufacturerA.id },
      1: { brand: this.VACCINE_BRANDS.Moderna, manufacturer: this.defaultEntities.manufacturerA.id },
      2: { brand: this.VACCINE_BRANDS.Janssen, manufacturer: this.defaultEntities.manufacturerB.id },
      3: { brand: this.VACCINE_BRANDS.Sputnik, manufacturer: this.defaultEntities.manufacturerB.id },
      4: { brand: this.VACCINE_BRANDS.Pfizer, manufacturer: this.defaultEntities.manufacturerB.id },
      5: { brand: this.VACCINE_BRANDS.Pfizer, manufacturer: this.defaultEntities.manufacturerA.id },
      6: { brand: this.VACCINE_BRANDS.Moderna, manufacturer: this.defaultEntities.manufacturerA.id },
      7: { brand: this.VACCINE_BRANDS.Moderna, manufacturer: this.defaultEntities.manufacturerB.id },
      8: { brand: this.VACCINE_BRANDS.Sputnik, manufacturer: this.defaultEntities.manufacturerB.id },
      9: { brand: this.VACCINE_BRANDS.Janssen, manufacturer: this.defaultEntities.manufacturerA.id }
    };

    this.coldChainInstance = await ColdChain.deployed();
    this.providerOrUrl = "http://localhost:8545";


  });

  it('should add entities successfully', async () => {
    for (const entity in this.defaultEntities) {
      const { id, mode } = this.defaultEntities[entity];

      const result = await this.coldChainInstance.addEntity(
        id,
        mode,
        { from: this.owner }
      );

      expectEvent(result.receipt, "AddEntity", {
        entityId: id,
        entityMode: mode
      });
      

      const retrievedEntity = await this.coldChainInstance.entities.call(id);
      assert.equal(id, retrievedEntity.id, "mismatched ids");
      assert.equal(this.ModeEnums[mode].pos, retrievedEntity.mode.toString(), "mismatched modes");
    }
  });

  it('should add vaccine batches successfully', async () => {
    for (let i = 0; i < Object.keys(this.defaultVaccineBatches).length; i++) {
      const { brand, manufacturer } = this.defaultVaccineBatches[i];

      const result = await this.coldChainInstance.addVaccineBatch(
        brand,
        manufacturer,
        { from: this.owner }
      );

      expectEvent(result.receipt, "AddVaccineBatch", {
        vaccineBatchId: String(i),
        manufacturer: manufacturer
      });
      

      const retrievedVaccineBatch = await this.coldChainInstance.vaccineBatches.call(i);
      assert.equal(i, retrievedVaccineBatch.id);
      assert.equal(brand, retrievedVaccineBatch.brand);
      assert.equal(manufacturer, retrievedVaccineBatch.manufacturer);
      assert.equal(undefined, retrievedVaccineBatch.certificateIds);
    }
  });

  it('should sign a message and store as a certificate from the issuer to the prover', async () => {
    for (let i = 0; i < Object.keys(this.defaultVaccineBatches).length; i++) {
      const { brand, manufacturer } = this.defaultVaccineBatches[i];

      const result = await this.coldChainInstance.addVaccineBatch(
        brand,
        manufacturer,
        { from: this.owner }
      );

      expectEvent(result.receipt, "AddVaccineBatch", {
        vaccineBatchId: String(i),
        manufacturer: manufacturer
      });
      

      const retrievedVaccineBatch = await this.coldChainInstance.vaccineBatches.call(i);
      assert.equal(i, retrievedVaccineBatch.id);
      assert.equal(brand, retrievedVaccineBatch.brand);
      assert.equal(manufacturer, retrievedVaccineBatch.manufacturer);
      assert.equal(undefined, retrievedVaccineBatch.certificateIds);
    }
  });
});
