const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");

const developmentChains = ["hardhat", "localhost"];
const INITIAL_SUPPLY = 20;
const TOKEN_NAME = "Trinh Token";
const TOKEN_SYMBOL = "TT";
const VALID_SPENDING = 100;
const INVALID_SPENDING = VALID_SPENDING * 10 ** 18;

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Token ERC20 Tests", () => {
      let token, tokenContract, deployer, accounts, user1, user2;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["token"]);
        tokenContract = await ethers.getContract("TokenERC20");
        token = await tokenContract.connect(deployer);
        user1 = accounts[1];
        user2 = accounts[2];
      });

      describe("constructor", () => {
        it("initialize the contract correctly", async () => {
          const initialSupply = await token.totalSupply();
          const decimals = await token.decimals();
          const tokenName = await token.name();
          const tokenSymbol = await token.symbol();
          const owner = await token.owner();
          const ownerBalance = await token.balanceOf(deployer.address);

          assert.equal(initialSupply / 10 ** decimals, INITIAL_SUPPLY);
          assert.equal(tokenName, TOKEN_NAME);
          assert.equal(tokenSymbol, TOKEN_SYMBOL);
          assert.equal(owner.toString(), deployer.address.toString());
          assert.equal(ownerBalance.toString(), initialSupply.toString());
        });
      });

      describe("transfer", () => {
        it("revert if sending coins to zero address", async () => {
          await expect(
            token.transfer(VALID_SPENDING, ethers.constants.AddressZero)
          ).to.be.revertedWithCustomError(
            token,
            "TokenERC20__ZeroAddressNotAllowed"
          );
        });

        it("revert if not enough tokens", async () => {
          await expect(
            token.transfer(INVALID_SPENDING.toString(), user1.address)
          ).to.be.revertedWithCustomError(token, "TokenERC20__NotEnoughTokens");
        });

        it("increase _to balance and decrease current user's balance", async () => {
          beforeCurrentUserBalance = await token.balanceOf(deployer.address);
          beforeRecipientBalance = await token.balanceOf(user1.address);
          await token.transfer(VALID_SPENDING, user1.address);
          afterCurrentUserBalance = await token.balanceOf(deployer.address);
          afterRecipientBalance = await token.balanceOf(user1.address);
          assert.equal(
            beforeCurrentUserBalance.toString(),
            ethers.BigNumber.from(afterCurrentUserBalance)
              .add(VALID_SPENDING)
              .toString()
          );
          assert.equal(
            afterRecipientBalance.toString(),
            ethers.BigNumber.from(beforeRecipientBalance)
              .add(VALID_SPENDING)
              .toString()
          );
        });

        it("fire Transfer event", async () => {
          await expect(token.transfer(VALID_SPENDING, user1.address))
            .to.emit(token, "Transfer")
            .withArgs(VALID_SPENDING, deployer.address, user1.address);
        });
      });

      describe("approve", () => {
        it("allow other user to use tokens", async () => {
          await token.approve(VALID_SPENDING, user1.address);
          const allowanceOfUser1 = await token.allowance(
            deployer.address,
            user1.address
          );
          assert.equal(allowanceOfUser1, VALID_SPENDING);
        });

        it("fire Approval event", async () => {
          await expect(token.approve(VALID_SPENDING, user1.address))
            .to.emit(token, "Approval")
            .withArgs(VALID_SPENDING, deployer.address, user1.address);
        });
      });

      describe("transferFrom", () => {
        it("revert if not enough allowance", async () => {
          await expect(
            token.transferFrom(VALID_SPENDING, user1.address, user2.address)
          ).to.be.revertedWithCustomError(
            token,
            "TokenERC20__NotEnoughAllowance"
          );
        });

        it("decrease allowance of _from user to current user", async () => {
          // give tokens to user 1
          await token.transfer(VALID_SPENDING, user1.address);

          // user 1 allows allowedAccount to use its tokens
          const allowedAccount = accounts[3];
          token = await token.connect(user1);
          await token.approve(VALID_SPENDING, allowedAccount.address);

          // allowedAccount sends tokens to user 2 on behalf of user 1
          token = await token.connect(allowedAccount);
          await token.transferFrom(
            VALID_SPENDING,
            user1.address,
            user2.address
          );

          const remainingAllowance = await token.allowance(
            user1.address,
            allowedAccount.address
          );
          assert.equal(remainingAllowance, 0);
        });
      });

      describe("burn", () => {
        it("burn tokens on behalf of current user", async () => {
          const beforeUserBalance = await token.balanceOf(deployer.address);
          const beforeSupply = await token.totalSupply();
          await token.burn(VALID_SPENDING);
          const afterUserBalance = await token.balanceOf(deployer.address);
          const afterSupply = await token.totalSupply();
          assert.equal(
            beforeUserBalance.toString(),
            ethers.BigNumber.from(afterUserBalance)
              .add(VALID_SPENDING)
              .toString()
          );
          assert.equal(
            beforeSupply.toString(),
            ethers.BigNumber.from(afterSupply).add(VALID_SPENDING).toString()
          );
        });

        it("fire Burn event", async () => {
          await expect(token.burn(VALID_SPENDING)).to.emit(token, "Burn");
        });
      });

      describe("burnFrom", () => {
        it("revert if _from is 0x0", async () => {
          await expect(
            token.burnFrom(ethers.constants.AddressZero, VALID_SPENDING)
          ).to.be.revertedWithCustomError(
            token,
            "TokenERC20__ZeroAddressNotAllowed"
          );
        });

        it("revert if not enough tokens", async () => {
          await expect(
            token.burnFrom(user1.address, VALID_SPENDING)
          ).to.be.revertedWithCustomError(token, "TokenERC20__NotEnoughTokens");
        });

        it("revert if not enough allowance", async () => {
          await token.transfer(VALID_SPENDING, user1.address);
          await expect(
            token.burnFrom(user1.address, VALID_SPENDING)
          ).to.be.revertedWithCustomError(
            token,
            "TokenERC20__NotEnoughAllowance"
          );
        });

        it("decrease tokens in totalSupply after burning", async () => {
          await token.transfer(VALID_SPENDING, user1.address);
          await token.approve(VALID_SPENDING, user1.address);
          token = token.connect(user1);
          const beforeTotalSupply = await token.totalSupply();
          await token.burnFrom(deployer.address, VALID_SPENDING);
          const afterTotalSupply = await token.totalSupply();
          assert.equal(
            beforeTotalSupply.toString(),
            ethers.BigNumber.from(afterTotalSupply)
              .add(VALID_SPENDING)
              .toString()
          );
        });

        it("fire Burn event", async () => {
          await token.transfer(VALID_SPENDING, user1.address);
          await token.approve(VALID_SPENDING, user1.address);
          token = token.connect(user1);
          await expect(
            token.burnFrom(deployer.address, VALID_SPENDING)
          ).to.emit(token, "Burn");
        });
      });

      describe("owner", () => {
        it("get owner address", async () => {
          const owner = await token.owner();
          assert.equal(owner, deployer.address);
        });
      });

      describe("abandonOwnership", () => {
        it("revert if not owner", async () => {
          token = await token.connect(user1);
          await expect(token.abandonOwnership()).to.be.revertedWithCustomError(
            token,
            "TokenERC20__NotOwner"
          );
        });

        it("owner is address zero", async () => {
          await token.abandonOwnership();
          const owner = await token.owner();
          assert.equal(owner, ethers.constants.AddressZero);
        });

        it("fire OwnershipTransferred event", async () => {
          await expect(token.abandonOwnership()).to.emit(
            token,
            "OwnershipTransferred"
          );
        });
      });

      describe("changeOwnership", () => {
        it("revert if not owner", async () => {
          token = await token.connect(user1);
          await expect(
            token.changeOwnership(user1.address)
          ).to.be.revertedWithCustomError(token, "TokenERC20__NotOwner");
        });

        it("revert if newOwner is address zero", async () => {
          await expect(
            token.changeOwnership(ethers.constants.AddressZero)
          ).to.be.revertedWithCustomError(
            token,
            "TokenERC20__ZeroAddressNotAllowed"
          );
        });

        it("change ownership to a new address", async () => {
          await token.changeOwnership(user1.address);
          const owner = await token.owner();
          assert.equal(owner, user1.address);
        });

        it("fire OwnershipTransferred event", async () => {
          await expect(token.changeOwnership(user1.address)).to.emit(
            token,
            "OwnershipTransferred"
          );
        });
      });
    });
