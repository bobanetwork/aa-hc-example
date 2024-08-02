import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
require("dotenv").config();

const TokenModule = buildModule("TokenPrice", (m) => {
  const tokenPrice = m.contract("TokenPrice", [
    process.env.TOKEN_PRICE_CONTRACT ?? "",
  ]);

  return { tokenPrice };
});

module.exports = TokenModule;
