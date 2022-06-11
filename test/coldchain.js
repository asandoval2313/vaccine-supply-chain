const { expectedEvent, BN } = require("@openzeppelin/test-helpers");

const ColdChain = artifacts.require("ColdChain");

contract('ColdChain', (accounts) => {
  it('should put 10000 ColdChain in the first account', async () => {
    const coldChainInstance = await ColdChain.deployed();
    const balance = await coldChainInstance.

    assert.equal(actual, expected, error);
  });
});
