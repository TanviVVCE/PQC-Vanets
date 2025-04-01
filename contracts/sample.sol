//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TrustContract {
    // Struct to store vehicle information
    struct Vehicle {
        uint256 trustValue; // Trust value of the vehicle (0-10)
        bool isRevoked;     // Security status (true if revoked)
    }

    // Mapping to store vehicles by their ID
    mapping(string => Vehicle) public vehicles;

    // Event to log trust value updates
    event TrustValueUpdated(string vehicleId, uint256 newTrustValue);

    // Set the initial trust value for a vehicle
    function setTrustValue(string memory vehicleId, uint256 trustValue) public {
        require(trustValue <= 10, "Trust value must be between 0 and 10");
        vehicles[vehicleId] = Vehicle({
            trustValue: trustValue,
            isRevoked: false
        });
    }

    // Update the trust value of a vehicle by an offset
    function updateTrustValue(string memory vehicleId, int256 offset) public {
        require(vehicles[vehicleId].trustValue != 0, "Vehicle does not exist");

        uint256 newTrustValue;
        if (offset > 0) {
            newTrustValue = vehicles[vehicleId].trustValue + uint256(offset);
        } else {
            newTrustValue = vehicles[vehicleId].trustValue - uint256(-offset);
        }

        // Ensure trust value stays within bounds (0-10)
        if (newTrustValue > 10) {
            newTrustValue = 10;
        } else if (newTrustValue < 0) {
            newTrustValue = 0;
        }

        vehicles[vehicleId].trustValue = newTrustValue;
        emit TrustValueUpdated(vehicleId, newTrustValue);
    }

    // Query the trust value of a vehicle
    function queryTrustValue(string memory vehicleId) public view returns (uint256) {
        require(vehicles[vehicleId].trustValue != 0, "Vehicle does not exist");
        return vehicles[vehicleId].trustValue;
    }

    // Classify a vehicle as high-priority, trusted, or untrusted
    function classifyVehicle(string memory vehicleId) public view returns (string memory) {
        require(vehicles[vehicleId].trustValue != 0, "Vehicle does not exist");

        if (vehicles[vehicleId].trustValue >= 8) {
            return "High-Priority";
        } else if (vehicles[vehicleId].trustValue >= 5) {
            return "Trusted";
        } else {
            return "Untrusted";
        }
    }

    // Revoke a vehicle (set security status to revoked)
    function revokeVehicle(string memory vehicleId) public {
        require(vehicles[vehicleId].trustValue != 0, "Vehicle does not exist");
        vehicles[vehicleId].isRevoked = true;
    }

    // Check if a vehicle is revoked
    function isRevoked(string memory vehicleId) public view returns (bool) {
        require(vehicles[vehicleId].trustValue != 0, "Vehicle does not exist");
        return vehicles[vehicleId].isRevoked;
    }
}