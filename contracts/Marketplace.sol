// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @author Derek Arends
 * @title A contract to manage ownership of assets
 */
contract Marketplace is ReentrancyGuard {
  /* 
   * State variables
   */
  using Counters for Counters.Counter;
  Counters.Counter private assetIds;
  Counters.Counter private loanIds;
  address payable private owner;
  uint256 private listingPrice = 0.025 ether;
  uint256 private minAssetPrice = 0.5 ether;
  
  mapping(uint256 => Asset) public assets;
  mapping(uint256 => Loan) public loans;
  mapping(address => mapping(uint256 => Asset)) ownership;

  /* 
   * Enums/Structs
   */
  enum State {
    ForSale,
    Pending,
    NotForSale
  }

  struct Asset {
    uint256 id;
    address nftContract;
    uint256 tokenId;
    string title;
    string description;
    uint256 price;
    State state;
    address payable owner;
    address payable seller;
    address payable lender;
  }

  struct Loan {
    uint256 id;
    address nftContract;
    Asset asset;
    uint256 loanAmount;
    uint256 interest;
    uint256 paymentAmount;
    uint256 frequency;
    uint256 expires;
    address payable borrower;
    address payable lender;
  }

  /* 
   * Events
   */
  event AssetListed(uint256 assetId);
  event AssetPending(uint256 assetId);
  event AssetSold(uint256 assetId);
  event LoanPayment(uint256 loanId);

  /* 
   * Modifiers
   */
  modifier onlyOwner() {
    require(msg.sender == owner, "Only an owner can do this");
    _;
  }

  /* 
   * Initialize the contract assigning the owner to the creator
   */
  constructor() {
    owner = payable(msg.sender);
  }

  /* 
   * Functions
   */

   /**
   * Gets the listing price for this market place
   * @return int256 as the market place listing price
   */
  function getListingPrice() public view returns (uint256) {
    return listingPrice;
  }

   /**
   * Set listing price
   */
  function setListingPrice(uint256 _newPrice) public onlyOwner {
    listingPrice = _newPrice * (1 ether);
  }

  /**
   * Gets the listing price for this market place
   * @return int256 as the market place listing price
   */
  function getMinAssetPrice() public view returns (uint256) {
    return minAssetPrice;
  }

  /**
   * Set the minimum asset price
   */
  function setMinimumAssetPrice(uint256 _newPrice) public onlyOwner {
    minAssetPrice = _newPrice * (1 ether);
  }

  /**
   * Get an individual asset based on _id
   * @param _id The id of the asset
   * @return The requested asset
   */
  function getAsset(uint256 _id) public view returns(Asset memory) {
    return assets[_id];
  }

  /**
   * Get an individual loan based on _id
   * @param _id The id of the loan
   * @return The requested loan
   */
  function getLoan(uint256 _id) public view returns(Loan memory) {
    return loans[_id];
  }

   /**
   * Creates the market item
   * Will emit the MarketItemCreated event and required eth
   * @param nftContract The Address of the nft
   * @param tokenId The token id
   * @param title The title of the asset
   * @param description The description of the asset
   * @param price The current price of the nft
   */
  function listAsset(
    address nftContract, 
    uint256 tokenId, 
    string memory title, 
    string memory description,
    uint256 price
  ) 
    public 
    payable 
    nonReentrant 
  {
    require(price >= minAssetPrice, "Price must be at least the minimum listing price");
    require(msg.value == listingPrice, "Must send in listing price");

    assetIds.increment();
    uint256 assetId = assetIds.current();

    assets[assetId] = Asset(
      assetId,
      nftContract,
      tokenId,
      title,
      description,
      price,
      State.ForSale,
      payable(msg.sender),
      payable(address(0)),
      payable(address(0))
    );

    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    emit AssetListed(assetId);
  }
}