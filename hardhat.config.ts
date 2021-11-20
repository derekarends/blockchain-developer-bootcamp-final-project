import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";

const fs = require("fs");
const secrets = fs.readFileSync(".secrets").toJSON();
const account = secrets.account;
const projectId = secrets.projectId;

const config: HardhatUserConfig = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      chainId: 1337,
    },
    // rinkeby: {
    //   url: `https://rinkeby.infura.io/v3/${projectId}`,
    //   accounts: [account]
    // }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};

export default config;