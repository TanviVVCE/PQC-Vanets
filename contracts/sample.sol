//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VehicleTrustManagement {
    struct Vehicle {
        uint256 trustValue;
        bool isRevoked;
    }

    mapping(string => Vehicle) public vehicles;
    mapping(uint256 => string) private trustClassifications;

    event TrustValueUpdated(string vehicleId, uint256 newTrustValue);
    event VehicleRevoked(string vehicleId);
    event VehicleUnrevoked(string vehicleId);

    constructor() {
        // Initialize trust classifications
        trustClassifications[0] = "Untrusted";
        trustClassifications[3] = "Low Trust";
        trustClassifications[7] = "Medium Trust";
        trustClassifications[10] = "High Trust";
    }

    function setTrustValue(string memory vehicleId, uint256 trustValue) public {
        require(bytes(vehicleId).length > 0, "Vehicle ID cannot be empty");
        require(trustValue <= 10, "Trust value must be between 0 and 10");
        
        vehicles[vehicleId].trustValue = trustValue;
        emit TrustValueUpdated(vehicleId, trustValue);
    }

    function queryTrustValue(string memory vehicleId) public view returns (uint256) {
        require(bytes(vehicleId).length > 0, "Vehicle ID cannot be empty");
        return vehicles[vehicleId].trustValue;
    }

    function updateTrustValue(string memory vehicleId, int256 offset) public {
        require(bytes(vehicleId).length > 0, "Vehicle ID cannot be empty");
        uint256 currentTrust = vehicles[vehicleId].trustValue;
        
        if (offset > 0) {
            require(currentTrust + uint256(offset) <= 10, "Trust value cannot exceed 10");
            vehicles[vehicleId].trustValue = currentTrust + uint256(offset);
        } else {
            require(currentTrust >= uint256(-offset), "Trust value cannot be negative");
            vehicles[vehicleId].trustValue = currentTrust - uint256(-offset);
        }
        
        emit TrustValueUpdated(vehicleId, vehicles[vehicleId].trustValue);
    }

    function classifyVehicle(string memory vehicleId) public view returns (string memory) {
        require(bytes(vehicleId).length > 0, "Vehicle ID cannot be empty");
        uint256 trustValue = vehicles[vehicleId].trustValue;
        
        if (trustValue >= 10) return trustClassifications[10];
        if (trustValue >= 7) return trustClassifications[7];
        if (trustValue >= 3) return trustClassifications[3];
        return trustClassifications[0];
    }

    function revokeVehicle(string memory vehicleId) public {
        require(bytes(vehicleId).length > 0, "Vehicle ID cannot be empty");
        require(!vehicles[vehicleId].isRevoked, "Vehicle is already revoked");
        
        vehicles[vehicleId].isRevoked = true;
        emit VehicleRevoked(vehicleId);
    }

    function unrevokeVehicle(string memory vehicleId) public {
        require(bytes(vehicleId).length > 0, "Vehicle ID cannot be empty");
        require(vehicles[vehicleId].isRevoked, "Vehicle is not revoked");
        
        vehicles[vehicleId].isRevoked = false;
        emit VehicleUnrevoked(vehicleId);
    }

    function isRevoked(string memory vehicleId) public view returns (bool) {
        require(bytes(vehicleId).length > 0, "Vehicle ID cannot be empty");
        return vehicles[vehicleId].isRevoked;
    }
}