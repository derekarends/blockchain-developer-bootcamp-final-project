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
contract AssetContract is ReentrancyGuard {
  /* 
   * State variables
   */
  using Counters for Counters.Counter;
  Counters.Counter private assetIds;

  address payable private owner;
  address private loanAddress;
  uint256 public listingPrice = 0.025 ether;
  uint256 public minAssetPrice = 0.5 ether;
  mapping(uint256 => Asset) public assets;

  /* 
   * Enums/Structs
   */
  enum AssetState {
    ForSale,
    Pending,
    NotForSale
  }

  struct Asset {
    uint256 id;
    address nftContract;
    uint256 tokenId;
    uint256 price;
    AssetState state;
    address payable seller;
    address payable owner;
    address payable lender;
  }
  
  /* 
   * Events
   */
  event AssetListed(uint256 assetId);
  event AssetCancelled(uint256 assetId);
  event AssetPending(uint256 assetId);
  event AssetSold(uint256 assetId);

  /* 
   * Modifiers
   */
  modifier onlyOwner() {
    require(msg.sender == owner, "Only an owner can do this");
    _;
  }

  modifier onlyForSale(Asset memory asset) {
    require(asset.seller != address(0) && asset.state == AssetState.ForSale, "Asset is not for sale");
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
   * Sets the address of the loan market place
   * @param _address address of loan market
   */
  function setLoanAddress(address _address) public {
    require(msg.sender == owner, "Only the owner can set the loan address");
    loanAddress = _address;
  }

   /**
   * Set listing price
   */
  function setListingPrice(uint256 _newPrice) public onlyOwner {
    listingPrice = _newPrice * (1 ether);
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
   * Get all assets
   * @return assetsToReturn is the list of assets available
   */
  // function getListings() 
  //   external 
  //   view 
  //   returns(Asset[] memory assetsToReturn) 
  // {
  //   uint256 numOfAllAssets = assetIds.current();
  //   uint256 numOfUnsoldAssets = 0;
  //   uint256 currentIndex = 0;

  //   for (uint256 i = 1; i <= numOfAllAssets; i++) {
  //     if (assets[i].seller != address(0) && assets[i].state == AssetState.ForSale) {
  //       numOfUnsoldAssets += 1;
  //     }
  //   }

  //   assetsToReturn = new Asset[](numOfUnsoldAssets);

  //   for (uint256 i = 1; i <= numOfAllAssets; i++) {
  //     if (assets[i].seller != address(0) && assets[i].state == AssetState.ForSale) {
  //       assetsToReturn[currentIndex] = assets[i];
  //       currentIndex += 1;
  //     }
  //   }

  //   return assetsToReturn;
  //  }

   /**
   * Creates and lists a new asset
   * Will emit the AssetListed event and required eth
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
      AssetState.ForSale,
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
    public 
    payable 
    onlyForSale(assets[_id])
    nonReentrant
  {
    Asset storage asset = assets[_id];

    require(asset.price == msg.value, "Invalid amount sent");
    require(asset.seller != msg.sender, "No need to buy your own asset");
    // require(asset.seller != address(0) && asset.state == State.ForSale, "Asset is not for sale");
    
    IERC721(asset.nftContract).transferFrom(address(this), msg.sender, asset.tokenId);
    asset.state = AssetState.NotForSale;
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
  // function getMyAssets() 
  //   external 
  //   view 
  //   returns(Asset[] memory assetsToReturn) 
  // {
  //   uint256 numOfAllAssets = assetIds.current();
  //   uint256 assetsSenderOwns = 0;
  //   uint256 currentIndex = 0;

  //   for (uint256 i = 1; i <= numOfAllAssets; i++) {
  //     if (assets[i].owner == msg.sender && assets[i].state != AssetState.ForSale) {
  //       assetsSenderOwns += 1;
  //     }
  //   }

  //   assetsToReturn = new Asset[](assetsSenderOwns);

  //   for (uint256 i = 1; i <= numOfAllAssets; i++) {
  //     if (assets[i].owner == msg.sender && assets[i].state != AssetState.ForSale) {
  //       assetsToReturn[currentIndex] = assets[i];
  //       currentIndex += 1;
  //     }
  //   }

  //   return assetsToReturn;
  //  }

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
    require(asset.state == AssetState.NotForSale, "Asset is pending or already listed");
    
    asset.price = _price;
    asset.state = AssetState.ForSale;
    asset.seller = payable(msg.sender);
    IERC721(asset.nftContract).transferFrom(msg.sender, address(this), asset.tokenId);

    emit AssetListed(asset.id);
  }

  /**
   * Cancels the asset for sale for a given asset id
   * @param _assetId the id of the asset
   */
   function cancelListingAsset(uint256 _assetId) external onlyForSale(assets[_assetId]) {
     require(assets[_assetId].seller == msg.sender, "Only seller can cancel listing");
     
     Asset storage asset = assets[_assetId];
     asset.state = AssetState.NotForSale;
     asset.seller = payable(address(0));

    IERC721(asset.nftContract).transferFrom(address(this), msg.sender, asset.tokenId);

     emit AssetCancelled(_assetId);
   }

  /**
   * Get the assets the user is selling
   * @return assetsToReturn is the list of assets available
   */
  // function getMyListedAssets() 
  //   external 
  //   view 
  //   returns(Asset[] memory assetsToReturn) 
  // {
  //   uint256 numOfAllAssets = assetIds.current();
  //   uint256 assetsSenderIsSelling = 0;
  //   uint256 currentIndex = 0;

  //   for (uint256 i = 1; i <= numOfAllAssets; i++) {
  //     if (assets[i].owner == msg.sender && assets[i].state == AssetState.ForSale) {
  //       assetsSenderIsSelling += 1;
  //     }
  //   }

  //   assetsToReturn = new Asset[](assetsSenderIsSelling);

  //   for (uint256 i = 1; i <= numOfAllAssets; i++) {
  //     if (assets[i].owner == msg.sender && assets[i].state == AssetState.ForSale) {
  //       assetsToReturn[currentIndex] = assets[i];
  //       currentIndex += 1;
  //     }
  //   }

  //   return assetsToReturn;
  //  }
}