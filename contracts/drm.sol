// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Music Royalties Distribution
contract MusicRoyalties is ChainlinkClient {

    using Counters for Counters.Counter;

    /// @notice Struct for storing song data
    struct Song {
        uint256 id;
        string title;
        string artist;
        uint256 playCount;
        uint256 totalRoyalties;
        mapping(uint256 => address) stakeholders;
        mapping(address => uint256) stakeholderShares;
        uint256 stakeholdersNumber;
    }
    mapping(uint256 => Song) public songs;
    Counters.Counter songsCounter;

    /// @notice Struct for storing license data
    struct License {
        uint256 id;
        uint256 songId;
        uint256 price;
        uint256 duration;
    }
    mapping(uint256 => License) public licenses;
    Counters.Counter licensesCounter;

    /// @notice Event for tracking song registration
    event SongRegistered(uint256 indexed id, address indexed artist, string metadata);

    /// @notice Event for tracking royalty distribution updates
    event RoyaltyDistributionUpdated(uint256 indexed id, address indexed artist);

    /// @notice Event for tracking royalty distribution
    event RoyaltiesDistributed(uint256 indexed id, uint256 playCount);


    /// @notice Function to register a song with its metadata and stakeholder shares
    /// @param id The unique identifier for the song
    /// @param title The title of the song
    /// @param artist The name of the artist who created the song
    /// @param stakeholders An array of addresses representing stakeholders of the song
    /// @param shares An array of shares corresponding to the stakeholders
    function registerSong(
        uint256 id,
        string calldata title,
        string calldata artist,
        address[] calldata stakeholders,
        uint256[] calldata shares
    ) external {
        require(stakeholders.length == shares.length, "Stakeholders and shares length mismatch");

        Song storage newSong = songs[id];
        newSong.id = id;
        newSong.title = title;
        newSong.artist = artist;
        newSong.stakeholdersNumber = stakeholders.length;

        for (uint256 i = 0; i < stakeholders.length; i++) {
            newSong.stakeholders[i] = stakeholders[i];
            newSong.stakeholderShares[stakeholders[i]] = shares[i];
        }
    }

    /// @notice Function to update royalty distribution for a specific song
    /// @param songId The unique identifier for the song to update
    /// @param stakeholders An array of addresses representing stakeholders of the song
    /// @param shares An array of shares corresponding to the stakeholders
    function updateRoyaltyDistribution(
        uint256 songId,
        address[] calldata stakeholders,
        uint256[] calldata shares
    ) external {
        require(stakeholders.length == shares.length, "Stakeholders and shares length mismatch");

        Song storage song = songs[songId];
        require(song.id != 0, "Song not found");

        for (uint256 i = 0; i < stakeholders.length; i++) {
            song.stakeholders[i] = stakeholders[i];
            song.stakeholderShares[stakeholders[i]] = shares[i];
        }
    }

    /// @notice Function to request song play data from an external source
    /// @param id The unique identifier for the song
    /// @param endpoint The external API endpoint to request the song play data
    function requestSongPlayData(uint256 id, string calldata endpoint) external {
        // Chainlink oracle details (oracle address, job ID, payment amount)
        // call the ChainlinkClient's request data function with the provided endpoint
    }

    /// @notice Function to calculate royalties for each stakeholder
    /// @param songId The unique identifier for the song
    /// @param playCount The number of plays for which royalties are calculated
    /// @return royaltyAmounts An array containing the calculated royalty amounts for each stakeholder
    function calculateRoyalties(uint256 songId, uint256 playCount) private view returns (uint256[] memory royaltyAmounts) {
        Song storage song = songs[songId];
        royaltyAmounts = new uint256[](song.stakeholdersNumber);

        for (uint256 i = 0; i < song.stakeholdersNumber; i++) {
            address stakeholder = song.stakeholders[i];
            uint256 share = song.stakeholderShares[stakeholder];
            uint256 amount = playCount * share / 100;

            royaltyAmounts[i] = amount;
        }
    }
    function calculateRoyaltiesTest(uint256 songId, uint256 playCount) external view returns (uint256[] memory royaltyAmounts) {
        return calculateRoyalties(songId, playCount);
    }



    /// @notice Function to distribute royalties to stakeholders for a specific song
    /// @param id The unique identifier for the song
    /// @param playCount The number of plays for which royalties are distributed
    /// @param tokenAddress The address of the ERC20 token used for royalty payments
    function distributeRoyalties(uint256 id, uint256 playCount, address tokenAddress) external {
        IERC20 token = IERC20(tokenAddress);
        Song storage song = songs[id];

        uint256[] memory royalties = calculateRoyalties(id, playCount);

        for (uint256 i = 0; i < song.stakeholdersNumber; i++) {
            address recipient = song.stakeholders[i];
            uint256 amount = royalties[i];
            require(token.transferFrom(msg.sender, recipient, amount), "Failed to transfer royalties");
        }
    }

    /// @notice Function to distribute royalties in batch for multiple songs
    /// @param ids An array of unique identifiers for the songs
    /// @param playCounts An array of play counts corresponding to the songs
    /// @param tokenAddress The address of the ERC20 token used for royalty payments
    function distributeRoyaltiesBatch(
        uint256[] calldata ids,
        uint256[] calldata playCounts,
        address tokenAddress
    ) external {
        require(ids.length == playCounts.length, "IDs and playCounts length mismatch");

        IERC20 token = IERC20(tokenAddress);

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 playCount = playCounts[i];
            Song storage song = songs[id];

            uint256[] memory royalties = calculateRoyalties(id, playCount);

            for (uint256 j = 0; j < song.stakeholdersNumber; j++) {
                address recipient = song.stakeholders[j];
                uint256 amount = royalties[j];
                require(token.transferFrom(msg.sender, recipient, amount), "Failed to transfer royalties");
            }
        }
    }

    /// @notice Function to create a new license for a song
    /// @param id The unique identifier for the license
    /// @param songId The unique identifier for the song
    /// @param price The price of the license in the specified ERC20 token
    /// @param duration The duration of the license in seconds
    function createLicense(
        uint256 id,
        uint256 songId,
        uint256 price,
        uint256 duration
    ) external {
        License storage newLicense = licenses[id];
        newLicense.id = id;
        newLicense.songId = songId;
        newLicense.price = price;
        newLicense.duration = duration;
    }

    /// @notice Function to purchase a license for a song
    /// @param id The unique identifier for the license
    /// @param tokenAddress The address of the ERC20 token used for the license payment
    function purchaseLicense(uint256 id, address tokenAddress) external {
        License storage license = licenses[id];
        require(license.id != 0, "License not found");

        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), license.price), "Failed to transfer license fee");

        Song storage song = songs[license.songId];

        uint256 totalShares;
        for (uint256 i = 0; i < song.stakeholdersNumber; i++) {
            totalShares += song.stakeholderShares[song.stakeholders[i]];
        }

        for (uint256 i = 0; i < song.stakeholdersNumber; i++) {
            address stakeholder = song.stakeholders[i];
            uint256 share = song.stakeholderShares[stakeholder];
            uint256 amount = (license.price * share) / totalShares;
            require(token.transfer(stakeholder, amount), "Failed to transfer revenue share");
        }
    }
}
