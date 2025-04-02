import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import yaml from "js-yaml";
import { ethers } from "ethers";

// Define the contract ABI
const CONTRACT_ABI = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        }
      ],
      "name": "revokeVehicle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "trustValue",
          "type": "uint256"
        }
      ],
      "name": "setTrustValue",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "newTrustValue",
          "type": "uint256"
        }
      ],
      "name": "TrustValueUpdated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        },
        {
          "internalType": "int256",
          "name": "offset",
          "type": "int256"
        }
      ],
      "name": "updateTrustValue",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "trustValue",
          "type": "uint256"
        }
      ],
      "name": "VehicleRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        }
      ],
      "name": "classifyVehicle",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        }
      ],
      "name": "debugVehicle",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        }
      ],
      "name": "isRevoked",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "vehicleId",
          "type": "string"
        }
      ],
      "name": "queryTrustValue",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];

// Function to read address book
function readAddressBook() {
    const addressBookPath = path.join(process.cwd(), "contracts", "address-book.yml");
    if (!fs.existsSync(addressBookPath)) {
        throw new Error("No deployed contracts found. Please deploy a contract first.");
    }
    return yaml.load(fs.readFileSync(addressBookPath, "utf8"));
}

async function interactWithDeployedContract(wallet) {
    try {
        console.log("Initializing contract interaction...");
        
        // Read contract address from address book
        const addressBook = readAddressBook();
        
        // If no contracts found in address book
        if (Object.keys(addressBook).length === 0) {
            throw new Error("No contracts found in address book");
        }

        // If only one contract, use it directly
        let contractName, contractAddress;
        if (Object.keys(addressBook).length === 1) {
            contractName = Object.keys(addressBook)[0];
            contractAddress = addressBook[contractName];
        } else {
            // If multiple contracts, let user choose
            const { selectedContract } = await inquirer.prompt([
                {
                    type: "list",
                    name: "selectedContract",
                    message: "Choose a contract to interact with:",
                    choices: Object.keys(addressBook).map(name => ({
                        name: `${name} (${addressBook[name]})`,
                        value: name
                    }))
                }
            ]);
            
            contractName = selectedContract;
            contractAddress = addressBook[contractName];
        }

        console.log(`Selected contract ${contractName} at address: ${contractAddress}`);
        
        // Create provider
        const provider = new ethers.providers.JsonRpcProvider('https://rpc-testnet.qanplatform.com');
        
        // Create contract instance
        const contract = new ethers.Contract(
            contractAddress,
            CONTRACT_ABI,
            wallet.connect(provider)
        );
        
        console.log(`Contract initialized at address: ${contractAddress}`);
        
        // Start interaction menu
        await interactWithContract(contract, CONTRACT_ABI, wallet);
        
    } catch (error) {
        console.error("Error initializing contract:", error);
        throw error;
    }
}

async function main() {
  console.log("Welcome to the Solidity Contract Deployer!");

  // Step 1: Ask for wallet access
  const { walletAccess, privateKey } = await inquirer.prompt([
    {
      type: "list",
      name: "walletAccess",
      message: "Choose wallet access:",
      choices: ["Raw HEX private key"],
    },
    {
      type: "password",
      name: "privateKey",
      message: "Enter raw HEX private key:",
      mask: '*', // Mask input with asterisks
    },
  ]);

  // Step 2: Initialize wallet and provider
  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey);
  } catch (error) {
    console.error("Invalid private key!");
    process.exit(1);
  }
  const provider = ethers.getDefaultProvider("https://rpc-testnet.qanplatform.com"); // Adjust provider URL as needed
  wallet = wallet.connect(provider);

  const balance = await wallet.getBalance();
  console.log(`Wallet address: ${wallet.address}`);
  console.log(`Avail. balance: ${ethers.utils.formatEther(balance)} ETH`);

  // Step 3: Main menu
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: ["Deploy contract", "Interact with contract"],
    },
  ]);

  if (action === "Deploy contract") {
    await deployContract(wallet);
  } else {
    await interactWithDeployedContract(wallet);
  }
}

async function deployContract(wallet) {
  console.log("Compiling contracts...");

  // Step 4: Compile Solidity files in the contracts directory
  const contractsPath = path.join("/contracts");
  const contractFiles = fs
    .readdirSync(contractsPath)
    .filter((file) => file.endsWith(".sol"));

  if (contractFiles.length === 0) {
    console.error("No Solidity files found!");
    return;
  }

  const compiledContracts = compileContracts(contractsPath, contractFiles);

  // Step 5: Prompt user to select a contract
  const { contractName } = await inquirer.prompt([
    {
      type: "list",
      name: "contractName",
      message: "Choose contract to deploy:",
      choices: Object.keys(compiledContracts),
    },
  ]);

  const contractData = compiledContracts[contractName];

  // Step 6: Ask for constructor parameters
  const constructorArgs = [];
  for (const input of contractData.abi.find(
    (item) => item.type === "constructor"
  )?.inputs || []) {
    const { value } = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message: `Constructor value ${input.name} (${input.type}):`,
      },
    ]);
    constructorArgs.push(value);
  }

  // Step 7: Deploy the contract
  console.log("Deploying contract...");
  const factory = new ethers.ContractFactory(
    contractData.abi,
    contractData.bytecode,
    wallet
  );

  try {
    const contract = await factory.deploy(...constructorArgs, {
      gasLimit: 8000000, // Set a manual gas limit
    });
    await contract.deployed();

    console.log(`Contract deployed at address: ${contract.address}`);

    // Step 8: Save the deployed contract address
    saveAddressToAddressBook(contractName, contract.address);

    // Step 9: Start interaction menu
    await interactWithContract(contract, contractData.abi, wallet);
  } catch (error) {
    console.error(`Failed to deploy contract: ${error.message}`);
  }
}

async function interactWithContract(contract, abi, wallet) {
  console.log(`You are now interacting with the contract at ${contract.address}`);

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Choose an action:",
        choices: [
          "Set trust value",
          "Update trust value",
          "Query trust value",
          "Classify vehicle",
          "Revoke vehicle",
          "Check if vehicle is revoked",
          "Exit interaction menu",
        ],
      },
    ]);

    if (action === "Exit interaction menu") {
      console.log("Exiting interaction menu...");
      break;
    }

    let result;
    switch (action) {
      case "Set trust value":
        const { vehicleId, trustValue } = await inquirer.prompt([
          {
            type: "input",
            name: "vehicleId",
            message: "Enter vehicle ID:",
          },
          {
            type: "input",
            name: "trustValue",
            message: "Enter trust value (0-10):",
          },
        ]);
        result = await contract.setTrustValue(vehicleId, trustValue);
        await result.wait();
        console.log(`Set trust value for vehicle ${vehicleId} to ${trustValue}`);
        break;

      case "Update trust value":
        const { vehicleId: updateVehicleId, offset } = await inquirer.prompt([
          {
            type: "input",
            name: "vehicleId",
            message: "Enter vehicle ID:",
          },
          {
            type: "input",
            name: "offset",
            message: "Enter offset (e.g., +1 or -1):",
          },
        ]);
        result = await contract.updateTrustValue(updateVehicleId, offset);
        await result.wait();
        console.log(`Updated trust value for vehicle ${updateVehicleId} by ${offset}`);
        break;

      case "Query trust value":
        const { vehicleId: queryVehicleId } = await inquirer.prompt([
          {
            type: "input",
            name: "vehicleId",
            message: "Enter vehicle ID:",
          },
        ]);
        const currentTrustValue = await contract.queryTrustValue(queryVehicleId);
        console.log(`Trust value for vehicle ${queryVehicleId}: ${currentTrustValue}`);
        break;

      case "Classify vehicle":
        const { vehicleId: classifyVehicleId } = await inquirer.prompt([
          {
            type: "input",
            name: "vehicleId",
            message: "Enter vehicle ID:",
          },
        ]);
        const classification = await contract.classifyVehicle(classifyVehicleId);
        console.log(`Vehicle ${classifyVehicleId} is classified as: ${classification}`);
        break;

      case "Revoke vehicle":
        const { vehicleId: revokeVehicleId } = await inquirer.prompt([
          {
            type: "input",
            name: "vehicleId",
            message: "Enter vehicle ID:",
          },
        ]);
        result = await contract.revokeVehicle(revokeVehicleId);
        await result.wait();
        console.log(`Revoked vehicle ${revokeVehicleId}`);
        break;

      case "Check if vehicle is revoked":
        const { vehicleId: isRevokedVehicleId } = await inquirer.prompt([
          {
            type: "input",
            name: "vehicleId",
            message: "Enter vehicle ID:",
          },
        ]);
        const isRevoked = await contract.isRevoked(isRevokedVehicleId);
        console.log(`Vehicle ${isRevokedVehicleId} is revoked: ${isRevoked}`);
        break;

      default:
        console.log("Invalid action!");
        break;
    }
  }
}

function compileContracts(contractsPath, contractFiles) {
  const compiledContracts = {};

  for (const file of contractFiles) {
    const filePath = path.join(contractsPath, file);
    console.log(`Compiling ${file}...`);

    try {
      const command = `solc --optimize --evm-version paris --combined-json abi,bin ${filePath}`;
      const output = execSync(command, { encoding: "utf8" });
      const jsonOutput = JSON.parse(output);

      if (!jsonOutput.contracts) {
        throw new Error(`Unexpected solc output: 'contracts' field is missing.`);
      }

      for (const [key, value] of Object.entries(jsonOutput.contracts)) {
        const contractName = key.split(":")[1];
        compiledContracts[contractName] = {
          abi: value.abi,
          bytecode: `0x${value.bin}`,
        };
      }
    } catch (error) {
      console.error(`Failed to compile ${file}: ${error.message}`);
      if (error.stdout) {
        console.error(`solc stdout: ${error.stdout}`);
      }
      if (error.stderr) {
        console.error(`solc stderr: ${error.stderr}`);
      }
    }
  }

  if (Object.keys(compiledContracts).length === 0) {
    throw new Error("No contracts were compiled. Please check your Solidity files.");
  }

  return compiledContracts;
}

function saveAddressToAddressBook(contractName, contractAddress) {
  const addressBookPath = path.join("/contracts", "address-book.yml");
  let addressBook = {};

  if (fs.existsSync(addressBookPath)) {
    addressBook = yaml.load(fs.readFileSync(addressBookPath, "utf8"));
  }

  addressBook[contractName] = contractAddress;
  fs.writeFileSync(addressBookPath, yaml.dump(addressBook));
  console.log(`Saved ${contractName} address to address-book.yml`);
}

// Run the application
main().catch((error) => {
  console.error(error);
  process.exit(1);
});