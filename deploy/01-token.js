const { network } = require("hardhat");
const { verify } = require("../utils/verify");

const developmentChains = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  const arguments = [20, "Trinh Token", "TT"];
  const token = await deploy("TokenERC20", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API) {
    log("Verifying...");
    await verify(token.address, arguments);
  }

  log("----------------------------------------------------");
};

module.exports.tags = ["all", "token"];
