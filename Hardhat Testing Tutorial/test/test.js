const { time,
        loadFixture,
        } = require("@nomicfoundation/hardhat-network-helpers");

        // console.log(time);
        // console.log(loadFixture);

        // console.log(time.days);

        const {anyValue} = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
        // console.log(anyValue);

        const { expect } = require("chai");
        const { ethers } = require("hardhat");

        // console.log(expect);

        describe("MyTest", function(){
            async function runEveryTime(){
                const ONE_YEARS_IN_SECONDS =365 * 24 * 60 * 60;
                const ONE_GEWI = 1000_000_000;

                const lockedAmount = ONE_GEWI;
                const unlockedTime = (await time.latest()) + ONE_YEARS_IN_SECONDS;

                //console.log(ONE_YEAR_IN_SECONDS, ONE_GEWI);
                // console.log(unlockedTime);

                // GET ACCOUNTS 
                const [owner, otherAccount] = await ethers.getSigners();
                // console.log(owner);
                // console.log(otherAccount);

                // console.log(unlockedTime, lockedAmount, owner, otherAccount);

                const MyTest = await ethers.getContractFactory("MyTest");
                const myTest = await MyTest.deploy(unlockedTime, {value: lockedAmount});

                return {myTest, unlockedTime, lockedAmount, owner, otherAccount};
            }

            describe("Deployment", function(){
                // CHECKING UNLOCKED TIME
                it("should check unlocked time", async function(){
                    const {myTest, unlockedTime} = await loadFixture(runEveryTime);

                    // console.log(unlockedTime);
                    // console.log(myTest);

                    expect(await myTest.unlockedTime()).to.equal(unlockedTime);
                    // const ab = expect(await myTest.unlockedTime()).to.equal(unlockedTime);
                    // console.log(ab);
                })

                // CHECKING OWNER
                it("Should set the right owner", async function(){
                    const {myTest, owner} = await loadFixture(runEveryTime);

                    expect(await myTest.owner()).to.equal(owner.address);
                })

                // CHECKING THE BALANCE
                it("Should receive and store the fund to MyTest", async function () {
                    const {myTest, lockedAmount} = await loadFixture(runEveryTime);

                    // console.log(lockedAmount);
                    // const contractBal = await ethers.provider.getBalance(myTest.address);
                    // console.log(contractBal.toNumber());

                    expect(await ethers.provider.getBalance(myTest.address)).to.equal(lockedAmount)
                })

                //CONDITION CHECK 
                it("Should fail if the unlocked is not in the future",async function(){
                    const latestTime = await time.latest();
                    // console.log(latestTime / 60 / 60 / 60 / 24);

                    const MyTest = await ethers.getContractFactory("MyTest");

                    await expect(MyTest.deploy(latestTime, {value: 1})).to.be.revertedWith("Your unlock Time should be in future");
                });
            });

            describe("Withdrawals", function(){
                describe("Validations", function(){
                    // TIME CHECK FOR WITHDRAW
                    it("Should revert with the right if called to soon", async function(){
                        const { myTest } = await loadFixture(runEveryTime);

                        await expect(myTest.withdraw()).to.be.revertedWith("Wait till the time period completes");
                    });

                    it("Should revert the message for right owner", async function(){
                        const {myTest, unlockedTime, otherAccount} = await loadFixture(runEveryTime);

                        // const newTime = await time.increaseTo(unlockedTime);
                        // console.log(newTime);
                        await time.increaseTo(unlockedTime);
                        await expect(myTest.connect(otherAccount).withdraw()).to.be.revertedWith("You are not the owner");
                    });

                    it("Should not fail if the unlockTime has arrived and the owner calls it", async function(){

                        const {myTest, unlockedTime} = await loadFixture(runEveryTime);

                        await time.increaseTo(unlockedTime);
                        await expect(myTest.withdraw()).not.to.be.reverted;
                    });


                })
                describe("EVENTS", function(){
                    // SUBMIT EVENTS 
                    it("Should emit the event on withdrawals", async function(){
                        const {myTest,unlockedTime, lockedAmount} = await loadFixture(runEveryTime);

                        await time.increaseTo(unlockedTime);

                        await expect(myTest.withdraw()).to.emit(myTest, "Withdrawal").withArgs(lockedAmount, anyValue);
                    });

                });

                describe("Transfer", function(){
                    it("Should transfer the funds to the owner", async function(){
                        const { myTest, unlockedTime, lockedAmount, owner } = await loadFixture(runEveryTime);

                        await time.increaseTo(unlockedTime);
    
                        await expect(myTest.withdraw()).to.changeEtherBalances([owner, myTest], [lockedAmount, -lockedAmount]);
                    });
                });
            });

           
            
            runEveryTime();

        })

