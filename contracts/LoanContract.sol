// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./AssetContract.sol";
import "hardhat/console.sol";

/**
 * @author Derek Arends
 * @title A contract to manage ownership of loans
 */
contract LoanContract is ReentrancyGuard {
  /* 
   * State variables
   */
  using Counters for Counters.Counter;
  Counters.Counter private loanIds;
  mapping(uint256 => Loan) private loans;

  AssetContract public assetContract;

  /* 
  * Enums/Structs
  */
  enum LoanState {
    New,
    Pending,
    Approved
  }

  struct Loan {
    uint256 id;
    uint256 assetId;
    uint256 loanAmount;
    LoanState state;
    address payable lender;
    address payable borrower;
  }

  /**
   * Events
   */
  event LoanCreated(uint256 loanId);
  event LoanCancelled(uint256 loanId);
  event LoanRequest(uint256 loanId);
  event LoanApproved(uint256 loanId);
  event LoanDeclined(uint256 loanId);
  event LogDepositReceived(address sender);

  /* 
   * Modifiers
   */
  modifier onlyLender(uint256 _loanId, string memory err) {
    require(msg.sender == loans[_loanId].lender, err);
    _;
  }

  modifier onlyPendingLoans(uint256 _loanId, string memory err) {
    require(loans[_loanId].state == LoanState.Pending, err);
    _;
  }

  modifier assetMustBeForSale(uint256 _assetId) {
    AssetContract.Asset memory asset = assetContract.getAsset(_assetId);
    require(asset.state == AssetContract.AssetState.ForSale && asset.seller != address(0), "Asset must be for sale");
    _;
  }

  /**
   * Constructor/Fallback
   */
  constructor(address _assetContract) {
    assetContract = AssetContract(payable(_assetContract));
  }

  receive() external payable {
    emit LogDepositReceived(msg.sender);
  }

  fallback() external payable { 
    require(msg.data.length == 0); 
    emit LogDepositReceived(msg.sender); 
  }

  /**
   * Functions
   */

  /**
   * @notice Get an individual loan based on _id
   * @param _id The id of the loan
   * @return The requested loan
   */
  function getLoan(uint256 _id) external view returns(Loan memory) {
    return loans[_id];
  }

  /**
   * @notice Get all loans
   * @return loansToReturn is the list of loans available
   */
  function getAllLoans() external view returns(Loan[] memory loansToReturn) {
    uint256 numOfAllLoans = loanIds.current();
    loansToReturn = new Loan[](numOfAllLoans);

    for (uint256 i = 0; i < numOfAllLoans; i++) {
        loansToReturn[i] = loans[i + 1];
    }

    return loansToReturn;
  }

  /**
   * @notice Creates an available loan for a given asset
   * @dev Will emit the LoanCreated event
   * @param _assetId The asset id
   */
  function createNewLoan(uint256 _assetId) 
    external 
    payable
    assetMustBeForSale(_assetId)
  {
    AssetContract.Asset memory asset = assetContract.getAsset(_assetId);
    require(msg.value >= asset.price, "Loan must be at least the amount of the asset");

    loanIds.increment();
    uint256 loanId = loanIds.current();

    loans[loanId] = Loan(
      loanId,
      _assetId,
      msg.value,
      LoanState.New,
      payable(msg.sender),
      payable(address(0))
    );

    emit LoanCreated(loanId);
  }

  /**
   * @notice Cancels the loan for a given loan id
   * @dev emits LoanCancelled event
   * @param _loanId the id of the loan
   */
  function cancelLoan(uint256 _loanId) 
    external
    onlyLender(_loanId, "Only the lender can canel the loan")
    nonReentrant
  {
    require(loans[_loanId].borrower == address(0), "Can not cancel an existing loan");

    (bool lenderGotFunds, ) = loans[_loanId].lender.call{value: loans[_loanId].loanAmount}("");
    require(lenderGotFunds, "Failed to transfer loan back to lender");

    delete loans[_loanId];
    loanIds.decrement();

    emit LoanCancelled(_loanId);
   }

   /**
    * @notice Allows a user to apply for a loan for a given asset
    * @dev emits LoanRequest event
    * @param _loanId the id of the loan
    */
  function applyForLoan(uint256 _loanId) 
    external 
    assetMustBeForSale(loans[_loanId].assetId)
  {
    require(loans[_loanId].state == LoanState.New, "This loan is not available");
    loans[_loanId].state = LoanState.Pending;
    loans[_loanId].borrower = payable(msg.sender);
    emit LoanRequest(_loanId);
  }

  /**
   * @notice Approves a pending loan for a given asset
   * @dev emits LoanApproved event
   * @param _loanId the id of the loan
   */
  function approveLoan(uint256 _loanId) 
    external
    onlyLender(_loanId, "Only lender can approve loan")
    onlyPendingLoans(_loanId, "Only pending loans can be approved")
  {
    loans[_loanId].state = LoanState.Approved;

    AssetContract.Asset memory asset = assetContract.getAsset(loans[_loanId].assetId);
    assetContract.buyAssetWithLoan{value: asset.price}(this, _loanId, asset.id);
    emit LoanApproved(_loanId);
  }

  /**
   * @notice Decline a pending loan for a given asset
   * @dev emits LoanDeclined event
   * @param _loanId the id of the loan
   */
  function declineLoan(uint256 _loanId)
    external
    onlyLender(_loanId, "Only lender can decline loan")  
    onlyPendingLoans(_loanId, "Only pending loans can be declined")
  { 
    loans[_loanId].state = LoanState.New;
    loans[_loanId].borrower = payable(address(0));
    emit LoanDeclined(_loanId);
  }
}