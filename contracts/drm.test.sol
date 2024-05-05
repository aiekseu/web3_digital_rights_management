// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./drm.sol";

/// @title Test Music Royalties Distribution contract
contract MusicRoyaltiesTest is MusicRoyalties {

    /// @notice Function to test royalties calculation for each stakeholder
    /// @param songId The unique identifier for the song
    /// @param playPrice The price of one play
    /// @return royaltyAmounts An array containing the calculated royalty amounts for each stakeholder
    function calculateRoyaltiesTest(uint256 songId, uint256 playPrice) external view returns (uint256[] memory royaltyAmounts) {
        return calculateRoyalties(songId, playPrice);
    }

    /// @notice Function to set songPlayCounts from tests
    /// @param songId The unique identifier for the song
    /// @param count The number of plays
    function setSongPlayCountTest(uint256 songId, uint256 count) external {
        songPlayCounts[songId] = count;
    }
}
