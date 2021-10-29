// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";


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
    uint256 price;
    State state;
    address payable seller;
    address payable owner;
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
   * Get all assets
   * @return assetsToReturn is the list of assets available
   */
  function getListings() 
    external 
    view 
    returns(Asset[] memory assetsToReturn) 
  {
    uint256 numOfAllAssets = assetIds.current();
    uint256 numOfUnsoldAssets = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].seller != address(0) && assets[i].state == State.ForSale) {
        numOfUnsoldAssets += 1;
      }
    }

    assetsToReturn = new Asset[](numOfUnsoldAssets);

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].seller != address(0) && assets[i].state == State.ForSale) {
        assetsToReturn[currentIndex] = assets[i];
        currentIndex += 1;
      }
    }

    return assetsToReturn;
   }

   /**
   * Creates and lists a new asset
   * Will emit the MarketItemCreated event and required eth
   * @param _nftContract The Address of the nft
   * @param _tokenId The token id
   * @param _price The current price of the nft
   */
  function listNewAsset(
    address _nftContract, 
    uint256 _tokenId, 
    uint256 _price
  ) 
    external 
    payable 
    nonReentrant 
  {
    require(_price >= minAssetPrice, "Price must be at least the minimum listing price");
    require(msg.value == listingPrice, "Must send in listing price");

    assetIds.increment();
    uint256 assetId = assetIds.current();

    assets[assetId] = Asset(
      assetId,
      _nftContract,
      _tokenId,
      _price,
      State.ForSale,
      payable(msg.sender),
      payable(msg.sender),
      payable(address(0))
    );

    IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

    emit AssetListed(assetId);
  }

  /**
   * Buys an asset
   * @param _id The Id of the asset to buy
   */
  function buyAsset(uint256 _id) 
    external 
    payable 
    nonReentrant 
  {
    Asset storage asset = assets[_id];

    require(asset.price == msg.value, "Invalid amount sent");
    require(asset.seller != msg.sender, "No need to buy your own asset");
    require(asset.seller != address(0) && asset.state == State.ForSale, "Asset is not for sale");
    
    IERC721(asset.nftContract).transferFrom(address(this), msg.sender, asset.tokenId);
    asset.state = State.NotForSale;
    asset.owner = payable(msg.sender);

    (bool sellerGotFunds, ) = asset.seller.call{value: asset.price}("");
    require(sellerGotFunds, "Failed to transfer value to seller");

    // clear seller after sending funds has succeeded
    asset.seller = payable(address(0));

    (bool feeTransfered, ) = owner.call{value: listingPrice}("");
    require(feeTransfered, "Failed to transfer fee");

    emit AssetSold(_id);
  }

  /**
   * Get the assets the sender owns
   * @return assetsToReturn is the list of assets available
   */
  function getMyAssets() 
    external 
    view 
    returns(Asset[] memory assetsToReturn) 
  {
    uint256 numOfAllAssets = assetIds.current();
    uint256 assetsSenderOwns = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender && assets[i].state != State.ForSale) {
        assetsSenderOwns += 1;
      }
    }

    assetsToReturn = new Asset[](assetsSenderOwns);

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender && assets[i].state != State.ForSale) {
        assetsToReturn[currentIndex] = assets[i];
        currentIndex += 1;
      }
    }

    return assetsToReturn;
   }

   /**
   * Lists and existing asset
   * @param _id The Id of the asset to list
   * @param _price The price of the asset
   */
  function listExistingAsset(uint256 _id, uint256 _price) 
    external 
    payable 
    nonReentrant 
  {
    require(_price >= minAssetPrice, "Price must be at least the minimum listing price");
    require(msg.value == listingPrice, "Must send in listing price");
    
    Asset storage asset = assets[_id];
    require(asset.owner == msg.sender, "You must own the asset");
    require(asset.state == State.NotForSale, "Asset is pending or already listed");
    
    asset.price = _price;
    asset.state = State.ForSale;
    asset.seller = payable(msg.sender);
    IERC721(asset.nftContract).transferFrom(msg.sender, address(this), asset.tokenId);

    emit AssetListed(asset.id);
  }

  /**
   * Get the assets the user is selling
   * @return assetsToReturn is the list of assets available
   */
  function getMyListedAssets() 
    external 
    view 
    returns(Asset[] memory assetsToReturn) 
  {
    uint256 numOfAllAssets = assetIds.current();
    uint256 assetsSenderIsSelling = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender && assets[i].state == State.ForSale) {
        assetsSenderIsSelling += 1;
      }
    }

    assetsToReturn = new Asset[](assetsSenderIsSelling);

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender && assets[i].state == State.ForSale) {
        assetsToReturn[currentIndex] = assets[i];
        currentIndex += 1;
      }
    }

    return assetsToReturn;
   }
}