// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LoanContract.sol";
import "hardhat/console.sol";


/**
 * @author Derek Arends
 * @title A contract to manage ownership of assets
 */
contract AssetContract is ReentrancyGuard, Ownable {
  /* 
   * State variables
   */
  using Counters for Counters.Counter;
  Counters.Counter private assetIds;

  uint256 public listingFee = 0.025 ether;
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

  modifier onlyForSale(Asset memory asset) {
    require(asset.seller != address(0) && asset.state == AssetState.ForSale, "Asset is not for sale");
    _;
  }

  /* 
   * Functions
   */

  /**
   * Set listing price
   */
  function setListingFee(uint256 _newPrice) public onlyOwner {
    listingFee = _newPrice * (1 ether);
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
  function getAllAssets() 
    external 
    view 
    returns(Asset[] memory assetsToReturn) 
  {
    uint256 numOfAllAssets = assetIds.current();
    assetsToReturn = new Asset[](numOfAllAssets);
    
    for (uint256 i = 0; i < numOfAllAssets; i++) {
      assetsToReturn[i] = assets[i + 1];
    }

    return assetsToReturn;
  }

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
    require(_price >= minAssetPrice, "Price must be at least the minimum asset price");
    require(msg.value == listingFee, "Must send in listing fee");

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
    
    IERC721(asset.nftContract).transferFrom(address(this), msg.sender, asset.tokenId);
    asset.state = AssetState.NotForSale;
    asset.owner = payable(msg.sender);

    (bool sellerGotFunds, ) = asset.seller.call{value: asset.price}("");
    require(sellerGotFunds, "Failed to transfer value to seller");

    // clear seller after sending funds has succeeded
    asset.seller = payable(address(0));

    (bool feeTransfered, ) = owner().call{value: listingFee}("");
    require(feeTransfered, "Failed to transfer fee");

    emit AssetSold(_id);
  }

  /**
   * Buys an asset with a loan
   * @param _loanAddress The address of the loan contract
   * @param _loanId is the id of the loan
   * @param _assetId is the id of the asset to buy
   */
  function buyAssetWithLoan(
    address _loanAddress, 
    uint256 _loanId,
    uint256 _assetId
  ) 
    public 
    payable 
    onlyForSale(assets[_assetId])
    nonReentrant
  {
    require(msg.sender == _loanAddress, "Only lender contract can call this");
    
    Asset storage asset = assets[_assetId];
    LoanContract.Loan memory loan = LoanContract(_loanAddress).getLoan(_loanId);

    require(msg.value == asset.price, "Invalid amount sent");
    require(loan.borrower != asset.seller, "No need to buy your own asset");
    
    IERC721(asset.nftContract).transferFrom(address(this), loan.borrower, asset.tokenId);
    asset.state = AssetState.NotForSale;
    asset.owner = payable(loan.borrower);
    asset.lender = payable(loan.lender);

    (bool sellerGotFunds, ) = asset.seller.call{value: msg.value}("");
    require(sellerGotFunds, "Failed to transfer value to seller");

    // clear seller after sending funds has succeeded
    asset.seller = payable(address(0));

    (bool feeTransfered, ) = owner().call{value: listingFee}("");
    require(feeTransfered, "Failed to transfer fee");

    emit AssetSold(_assetId);
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
    require(_price >= minAssetPrice, "Price must be at least the minimum asset price");
    require(msg.value == listingFee, "Must send in listing fee");
    
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
}