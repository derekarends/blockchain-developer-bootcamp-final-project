import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";

const fs = require("fs");
const secrets = fs.readFileSync(".secrets").toJSON();
const account = secrets.account;
const projectId = secrets.projectId;

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // rinkeby: {
    //   url: `https://rinkeby.infura.io/v3/${projectId}`,
    //   accounts: [account]
    // }
  },
  solidity: "0.8.4",
};

export default config;