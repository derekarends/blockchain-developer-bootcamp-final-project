// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @author Derek Arends
 * @title A simple contract to mint NFTs
 * @dev This will create a contract specific to the asset contract
 * and create a token to associate the uri with the sender
 */
contract NFT is ERC721URIStorage {
  using Counters for Counters.Counter;
  Counters.Counter private tokenIds;
  address private contractAddress;

  /**
   * @param assetAddress is the as address of the asset contract for this NFT Token
   */
  constructor(address assetAddress) ERC721("Ownership Tokens", "OT") {
    contractAddress = assetAddress;
  }

  /**
   * @dev Create a new Ownership token to be associated with asset
   * @param _tokenURI The url of the asset
   * @return uint256 as a new tokenId
   */
  function createToken(string memory _tokenURI) public returns (uint256) {
    tokenIds.increment();
    uint256 newItemId = tokenIds.current();

    _safeMint(msg.sender, newItemId);
    _setTokenURI(newItemId, _tokenURI);
    _approve(contractAddress, newItemId);

    return newItemId;
  }
}
