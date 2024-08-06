import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
require("dotenv").config();

const TokenModule = buildModule("TokenPrice", (m) => {
  if (!process.env.HYBRID_ACCOUNT) {
    throw Error("HYBRID_ACCOUNT must be set!")
  }
  console.log('HA verified -> ', process.env.HYBRID_ACCOUNT);

  const tokenPrice = m.contract("TokenPrice", [
    process.env.HYBRID_ACCOUNT,
  ]);

  return { tokenPrice };
});

module.exports = TokenModule;
