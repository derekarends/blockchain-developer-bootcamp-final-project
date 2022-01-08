// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

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
  mapping(uint256 => Asset) private assets;

  LoanContract public loanContract;
  uint256 public listingFee = 0.025 ether;
  uint256 public minAssetPrice = 0.1 ether;

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
  event LogDepositReceived(address sender);

  /* 
   * Modifiers
   */
  modifier onlyForSale(Asset memory asset) {
    require(asset.seller != address(0) && asset.state == AssetState.ForSale, "Asset is not for sale");
    _;
  }

  /**
   * Constructor/Fallback
   */
  receive() external payable {
    emit LogDepositReceived(msg.sender);
  }

  fallback() external payable { 
    require(msg.data.length == 0); 
    emit LogDepositReceived(msg.sender); 
  }

  /* 
   * Functions
   */
  
  /**
   * @notice set the loan contract
   * @param _addr the address of the loan contract
   */
  
  function setLoanContract(address _addr) external onlyOwner {
    loanContract = LoanContract(payable(_addr));
  }

  /**
   * @notice Set listing price
   */
  function setListingFee(uint256 _newPrice) external onlyOwner {
    listingFee = _newPrice * (1 ether);
  }

  /**
   * @notice Set the minimum asset price
   */
  function setMinimumAssetPrice(uint256 _newPrice) external onlyOwner {
    minAssetPrice = _newPrice * (1 ether);
  }

  /**
   * @notice Get an individual asset based on _id
   * @param _id The id of the asset
   * @return The requested asset
   */
  function getAsset(uint256 _id) external view returns(Asset memory) {
    return assets[_id];
  }

  /**
   * @notice Get all assets
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
   * @notice Get all assets for sale
   * @return assetsToReturn is the list of assets available
   */
  function getAssetsForSale() 
    external 
    view 
    returns(Asset[] memory assetsToReturn) 
  {
    uint256 numOfAllAssets = assetIds.current();
    uint256 numOfAssetsForSale = 0;

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].seller != address(0) && assets[i].state == AssetState.ForSale) {
        numOfAssetsForSale++;
      }
    }

    assetsToReturn = new Asset[](numOfAssetsForSale);
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].seller != address(0) && assets[i].state == AssetState.ForSale) {
        assetsToReturn[currentIndex] = assets[i];
        currentIndex += 1;
      }
    }

    return assetsToReturn;
  }

  /**
   * @notice Get all assets the owner has
   * @return assetsToReturn is the list of assets available
   */
  function getOwnerAssets() 
    external 
    view 
    returns(Asset[] memory assetsToReturn) 
  {
    uint256 numOfAllAssets = assetIds.current();
    uint256 numOfAssetsOwned = 0;

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender) {
        numOfAssetsOwned += 1;
      }
    }

    assetsToReturn = new Asset[](numOfAssetsOwned);
    uint256 currentIndex = 0;
    
    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender) {
        assetsToReturn[currentIndex] = assets[i];
        currentIndex += 1;
      }
    }

    return assetsToReturn;
  }

  /**
   * @notice Creates and lists a new asset
   * @dev Will emit the AssetListed event and required eth
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
   * @notice Buys an asset
   * @dev emits AssetSold event
   * @param _id The Id of the asset to buy
   */
  function buyAsset(uint256 _id) 
    external 
    payable 
    onlyForSale(assets[_id])
    nonReentrant
  {
    completePurchase(_id, msg.sender, address(0));
  }

  /**
   * @notice Buys an asset with a loan
   * @dev emits AssetSold event
   * @param _loanId is the id of the loan
   * @param _assetId is the id of the asset to buy
   */
  function buyAssetWithLoan(
    uint256 _loanId,
    uint256 _assetId
  ) 
    external 
    payable 
    onlyForSale(assets[_assetId])
    nonReentrant
  { 
    require(address(loanContract) != address(0) && msg.sender == address(loanContract), "Only loan contract can call this");
    LoanContract.Loan memory loan = loanContract.getLoan(_loanId);
    completePurchase(_assetId, loan.borrower, loan.lender);
  }

  /**
   * @notice Completes the purchase
   * @param _assetId is the id of the asset
   * @param _newOwner is the new owner of the asset
   * @param _lender is the lender of the asset
   */
  function completePurchase(
    uint256 _assetId,
    address _newOwner,
    address _lender
  ) 
    private 
  {
    Asset storage asset = assets[_assetId];
    
    require(msg.value == asset.price, "Invalid amount sent");
    require(_newOwner != asset.seller, "No need to buy your own asset");
    
    IERC721(asset.nftContract).transferFrom(address(this), _newOwner, asset.tokenId);
    asset.state = AssetState.NotForSale;
    asset.owner = payable(_newOwner);
    asset.lender = payable(_lender);

    address previousSeller = asset.seller;
    asset.seller = payable(address(0));

    (bool sellerGotFunds, ) = previousSeller.call{value: msg.value}("");
    require(sellerGotFunds, "Failed to transfer value to seller");

    (bool feeTransfered, ) = owner().call{value: listingFee}("");
    require(feeTransfered, "Failed to transfer fee");

    emit AssetSold(_assetId);
  }

  /**
   * @notice Lists and existing asset
   * @dev emits AssetListed event
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
   * @notice Cancels the asset for sale for a given asset id
   * @dev emits AssetCancelled event
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
   * Allow a lender to reclaim the asset if loan is expired
   */
  function reclaimAsset(uint256 _assetId) external {
    require (assets[_assetId].lender == msg.sender, "Ownly the lender can reclaim the asset");
    // TODO: Implement functionality to allow lenders to reclaim assets
  }
}