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

  enum LoanState {
    New,
    Pending,
    Approved
  }

  struct Loan {
    uint256 id;
    uint256 assetId;
    uint256 loanAmount;
    uint256 interest;
    uint256 paymentAmount;
    uint256 expires;
    LoanState state;
    address payable lender;
    address payable borrower;
  }

  /* 
   * Events
   */
  event AssetListed(uint256 assetId);
  event AssetCancelled(uint256 assetId);
  event AssetPending(uint256 assetId);
  event AssetSold(uint256 assetId);
  event LoanCreated(uint256 loanId);
  event LoanCancelled(uint256 loanId);
  event LoanRequest(uint256 loanId);
  event LoanApproved(uint256 loanId);
  event LoanPayment(uint256 loanId);
  event LoanDeclined(uint256 loanId);

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
      if (assets[i].seller != address(0) && assets[i].state == AssetState.ForSale) {
        numOfUnsoldAssets += 1;
      }
    }

    assetsToReturn = new Asset[](numOfUnsoldAssets);

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].seller != address(0) && assets[i].state == AssetState.ForSale) {
        assetsToReturn[currentIndex] = assets[i];
        currentIndex += 1;
      }
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
  function getMyAssets() 
    external 
    view 
    returns(Asset[] memory assetsToReturn) 
  {
    uint256 numOfAllAssets = assetIds.current();
    uint256 assetsSenderOwns = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender && assets[i].state != AssetState.ForSale) {
        assetsSenderOwns += 1;
      }
    }

    assetsToReturn = new Asset[](assetsSenderOwns);

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender && assets[i].state != AssetState.ForSale) {
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
  function getMyListedAssets() 
    external 
    view 
    returns(Asset[] memory assetsToReturn) 
  {
    uint256 numOfAllAssets = assetIds.current();
    uint256 assetsSenderIsSelling = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender && assets[i].state == AssetState.ForSale) {
        assetsSenderIsSelling += 1;
      }
    }

    assetsToReturn = new Asset[](assetsSenderIsSelling);

    for (uint256 i = 1; i <= numOfAllAssets; i++) {
      if (assets[i].owner == msg.sender && assets[i].state == AssetState.ForSale) {
        assetsToReturn[currentIndex] = assets[i];
        currentIndex += 1;
      }
    }

    return assetsToReturn;
   }

  /**
   * Creates an available loan for a given asset
   * Will emit the LoanCreated event
   * @param _assetId The asset id
   * @param _interest The interest owned on loan
   * @param _paymentAmount The amount to be payed per time
   */
  function createNewLoan (
    uint256 _assetId,
    uint256 _interest,
    uint256 _paymentAmount
  ) 
    external 
    payable 
    onlyForSale(assets[_assetId])
    nonReentrant
  {
    require(msg.value == assets[_assetId].price, "Must send in price of asset");

    loanIds.increment();
    uint256 loanId = loanIds.current();

    loans[loanId] = Loan(
      loanId,
      _assetId,
      assets[_assetId].price,
      _interest,
      _paymentAmount,
      0,
      LoanState.New,
      payable(msg.sender),
      payable(address(0))
    );

    emit LoanCreated(loanId);
  }

  /**
   * Cancels the loan for a given loan id
   * @param _loanId the id of the loan
   */
   function cancelLoan(uint256 _loanId) external {
     require(loans[_loanId].lender == msg.sender, "Only the lender can canel the loan");
     require(loans[_loanId].borrower == address(0), "Can not cancel an existing loan");

     delete loans[_loanId];

     emit LoanCancelled(_loanId);
   }

  /**
   * Get the loans the sender owns
   * @return loansToReturn is the list of loans available
   */
  function getMyLendings() 
    external 
    view 
    returns(Loan[] memory loansToReturn) 
  {
    uint256 numOfAllLoans = loanIds.current();
    uint256 loansSenderOwns = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllLoans; i++) {
      if (loans[i].lender == msg.sender) {
        loansSenderOwns += 1;
      }
    }

    loansToReturn = new Loan[](loansSenderOwns);

    for (uint256 i = 1; i <= numOfAllLoans; i++) {
      if (loans[i].lender == msg.sender) {
        loansToReturn[currentIndex] = loans[i];
        currentIndex += 1;
      }
    }

    return loansToReturn;
   }

   /**
   * Get the loans available for a given asset
   * @param _assetId The id of the asset
   * @return loansToReturn is the list of loans available
   */
  function getAvailableAssetLoans(
    uint256 _assetId
  ) 
    external 
    view 
    returns(Loan[] memory loansToReturn) 
  {
    uint256 numOfAllLoanss = loanIds.current();
    uint256 availLoans = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllLoanss; i++) {
      if (loans[i].assetId == _assetId) {
        availLoans += 1;
      }
    }

    loansToReturn = new Loan[](availLoans);

    for (uint256 i = 1; i <= numOfAllLoanss; i++) {
      if (loans[i].assetId == _assetId) {
        loansToReturn[currentIndex] = loans[i];
        currentIndex += 1;
      }
    }

    return loansToReturn;
   }

   /**
    * Allows a user to apply for a loan for a given asset
    * @param _loanId the id of the loan
    */
   function applyForLoan(uint256 _loanId) external {
     require(loans[_loanId].state == LoanState.New, "This loan is not available");
     loans[_loanId].state = LoanState.Pending;
     loans[_loanId].borrower = payable(msg.sender);
     emit LoanRequest(_loanId);
   }

  /**
   * Approves a pending loan for a given asset
   * @param _loanId the id of the loan
   */
   function approveLoan(uint256 _loanId) external {
     require(msg.sender == loans[_loanId].lender, "Only lender can approve loan");
     loans[_loanId].state = LoanState.Approved;
     emit LoanApproved(_loanId);
   }

   /**
   * Decline a pending loan for a given asset
   * @param _loanId the id of the loan
   */
   function declineLoan(uint256 _loanId) external {
     require(msg.sender == loans[_loanId].lender, "Only lender can decline loan");
     loans[_loanId].state = LoanState.New;
     loans[_loanId].borrower = payable(address(0));
     emit LoanDeclined(_loanId);
   }

   /**
   * Buy asset with loan
   * @param _loanId the id of the loan
   */
   function buyAssetWithLoan(uint256 _loanId) external {
     require(loans[_loanId].borrower == msg.sender, "Only loan borrower can buy asset wit this loan");
     require(loans[_loanId].state == LoanState.Approved, "Loan needs to be approved");
     buyAsset(loans[_loanId].assetId);
     emit LoanApproved(_loanId);
   }

   /**
   * Get the loans the sender is borrowing
   * @return loansToReturn
   */
  function getMyLoans() 
    external 
    view 
    returns(Loan[] memory loansToReturn) 
  {
    uint256 numOfAllLoans = loanIds.current();
    uint256 loansSenderBorrowing = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= numOfAllLoans; i++) {
      if (loans[i].borrower == msg.sender) {
        loansSenderBorrowing += 1;
      }
    }

    loansToReturn = new Loan[](loansSenderBorrowing);

    for (uint256 i = 1; i <= numOfAllLoans; i++) {
      if (loans[i].borrower == msg.sender) {
        loansToReturn[currentIndex] = loans[i];
        currentIndex += 1;
      }
    }

    return loansToReturn;
   }
}