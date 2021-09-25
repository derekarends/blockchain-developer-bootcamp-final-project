// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @author Derek Arends
 * @title A simple contract to mint NFTs
 * @dev This will create a contract specific to the maketplace
 * and create a token to associate the uri with the sender
 */
contract NFT is ERC721URIStorage {
  using Counters for Counters.Counter;
  Counters.Counter private tokenIds;
  address private contractAddress;

  /**
   * @param marketPlaceAddress is the as address of the market place of this NFT Token
   */
  constructor(address marketPlaceAddress) ERC721("Ownership Tokens", "OT") {
    contractAddress = marketPlaceAddress;
  }

  /**
   * Create a new NFT Token
   * @param _tokenURI The url of the NFT
   * @return uint256 as a new tokenId
   */
  function createToken(string memory _tokenURI) public returns (uint256) {
    tokenIds.increment();
    uint256 newItemId = tokenIds.current();

    _safeMint(msg.sender, newItemId);
    _setTokenURI(newItemId, _tokenURI);
    setApprovalForAll(contractAddress, true);

    return newItemId;
  }
}
