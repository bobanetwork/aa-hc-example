import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenModule = buildModule("TokenPrice", (m) => {
  const tokenPrice = m.contract("TokenPrice", [
    "0x587a06089ed54101dd6d9A8ecDe1d146f97Af6B8",
  ]);

  return { tokenPrice };
});

module.exports = TokenModule;