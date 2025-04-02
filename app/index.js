import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import yaml from "js-yaml";
import { ethers } from "ethers";
import { spawn } from "child_process";

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

// Function to verify vehicle trust through RSU
async function verifyVehicleTrust(contract, vehicleId) {
    try {
        console.log(`RSU verifying trust for vehicle ${vehicleId}...`);
        const trustValue = await contract.queryTrustValue(vehicleId);
        const isRevoked = await contract.isRevoked(vehicleId);
        console.log(`Trust verification complete for ${vehicleId}: trust=${trustValue}, revoked=${isRevoked}`);
        return {
            trustValue: trustValue.toNumber(),
            isRevoked: isRevoked
        };
    } catch (error) {
        console.error(`Error verifying trust for vehicle ${vehicleId}:`, error);
        return null;
    }
}

// Function to process accident report
async function processAccidentReport(contract, report) {
    try {
        const { vehicleId, location, timestamp, nearbyRSUs } = report;
        
        // Verify vehicle trust through RSU
        if (nearbyRSUs.length > 0) {
            console.log(`RSU ${nearbyRSUs[0]} verifying accident report from vehicle ${vehicleId}`);
            const trustInfo = await verifyVehicleTrust(contract, vehicleId);
            
            if (trustInfo && !trustInfo.isRevoked && trustInfo.trustValue >= 5) {
                console.log(`Accident verified by RSU ${nearbyRSUs[0]}. Vehicle trust: ${trustInfo.trustValue}`);
                
                // Update trust value based on accident
                const tx = await contract.updateTrustValue(vehicleId, -2); // Reduce trust by 2
                await tx.wait();
                console.log(`Updated trust value for vehicle ${vehicleId} after accident`);
                
                return true;
            } else {
                console.log(`Accident report rejected by RSU ${nearbyRSUs[0]}. Vehicle trust: ${trustInfo?.trustValue}`);
                return false;
            }
        } else {
            console.log(`No RSU nearby for vehicle ${vehicleId}`);
            return false;
        }
    } catch (error) {
        console.error(`Error processing accident report:`, error);
        return false;
    }
}

async function startVehicleMonitoring(wallet) {
    try {
        console.log("Starting vehicle monitoring...");
        
        // Read contract address from address book
        const addressBook = readAddressBook();
        const contractName = Object.keys(addressBook)[0];
        const contractAddress = addressBook[contractName];
        
        // Create provider and contract instance
        const provider = new ethers.providers.JsonRpcProvider('https://rpc-testnet.qanplatform.com');
        const contract = new ethers.Contract(
            contractAddress,
            CONTRACT_ABI,
            wallet.connect(provider)
        );
        
        console.log(`Contract initialized at address: ${contractAddress}`);
        
        // Start Python simulation
        const pythonProcess = spawn('python3', ['vehicle_monitor.py'], {
            cwd: path.join(process.cwd(), 'VANETs/veins/veins/examples/veins')
        });

        let buffer = '';
        
        pythonProcess.stdout.on('data', async (data) => {
            try {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.trim()) {
                        const reports = JSON.parse(line);
                        for (const report of reports) {
                            if (report.type === "ACCIDENT") {
                                console.log(`Received accident report for vehicle ${report.vehicleId}`);
                                await processAccidentReport(contract, report);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing data:', error);
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error('Python error:', data.toString());
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
        });

        // Handle process termination
        process.on('SIGINT', () => {
            console.log('Stopping simulation...');
            pythonProcess.kill();
            process.exit();
        });

    } catch (error) {
        console.error("Error in vehicle monitoring:", error);
        throw error;
    }
}

async function main() {
    console.log("Welcome to the Vehicle Trust Management System!");

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
            mask: '*',
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
    const provider = ethers.getDefaultProvider("https://rpc-testnet.qanplatform.com");
    wallet = wallet.connect(provider);

    const balance = await wallet.getBalance();
    console.log(`Wallet address: ${wallet.address}`);
    console.log(`Available balance: ${ethers.utils.formatEther(balance)} ETH`);

    // Step 3: Start vehicle monitoring
    await startVehicleMonitoring(wallet);
}

// Run the application
main().catch((error) => {
    console.error(error);
    process.exit(1);
});