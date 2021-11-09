// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
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

  address payable private owner;
  address private assetAddress;
  mapping(uint256 => Loan) public loans;

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
    uint256 interest;
    uint256 paymentAmount;
    uint256 expires;
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
  event LoanPayment(uint256 loanId);
  event LoanDeclined(uint256 loanId);

  constructor() {
    owner = payable(msg.sender);
  }

  /**
   * Functions
   */

  /**
   * Sets the address of the asset market place
   * @param _address address of asset market
   */
  function setAssetAddress(address _address) public {
    require(msg.sender == owner, "Only the owner can set the asset address");
    assetAddress = _address;
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
    nonReentrant
  {
    // Get Asset
    // Add require asset to be for sale
    // require(msg.value == assets[_assetId].price, "Must send in price of asset");
    loanIds.increment();
    uint256 loanId = loanIds.current();

    loans[loanId] = Loan(
      loanId,
      _assetId,
      0, //assets[_assetId].price,
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
  // function getMyLendings() 
  //   external 
  //   view 
  //   returns(Loan[] memory loansToReturn) 
  // {
  //   uint256 numOfAllLoans = loanIds.current();
  //   uint256 loansSenderOwns = 0;
  //   uint256 currentIndex = 0;

  //   for (uint256 i = 1; i <= numOfAllLoans; i++) {
  //     if (loans[i].lender == msg.sender) {
  //       loansSenderOwns += 1;
  //     }
  //   }

  //   loansToReturn = new Loan[](loansSenderOwns);

  //   for (uint256 i = 1; i <= numOfAllLoans; i++) {
  //     if (loans[i].lender == msg.sender) {
  //       loansToReturn[currentIndex] = loans[i];
  //       currentIndex += 1;
  //     }
  //   }

  //   return loansToReturn;
  //  }

   /**
   * Get the loans available for a given asset
   * @param _assetId The id of the asset
   * @return loansToReturn is the list of loans available
   */
  // function getAvailableAssetLoans(
  //   uint256 _assetId
  // ) 
  //   external 
  //   view 
  //   returns(Loan[] memory loansToReturn) 
  // {
  //   uint256 numOfAllLoanss = loanIds.current();
  //   uint256 availLoans = 0;
  //   uint256 currentIndex = 0;

  //   for (uint256 i = 1; i <= numOfAllLoanss; i++) {
  //     if (loans[i].assetId == _assetId && loans[i].state == LoanState.New) {
  //       availLoans += 1;
  //     }
  //   }

  //   loansToReturn = new Loan[](availLoans);

  //   for (uint256 i = 1; i <= numOfAllLoanss; i++) {
  //     if (loans[i].assetId == _assetId&& loans[i].state == LoanState.New) {
  //       loansToReturn[currentIndex] = loans[i];
  //       currentIndex += 1;
  //     }
  //   }

  //   return loansToReturn;
  //  }

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
     // buyAsset(loans[_loanId].assetId);
     emit LoanApproved(_loanId);
   }

   /**
   * Get the loans the sender is borrowing
   * @return loansToReturn
   */
  // function getMyLoans() 
  //   external 
  //   view 
  //   returns(Loan[] memory loansToReturn) 
  // {
  //   uint256 numOfAllLoans = loanIds.current();
  //   uint256 loansSenderBorrowing = 0;
  //   uint256 currentIndex = 0;

  //   for (uint256 i = 1; i <= numOfAllLoans; i++) {
  //     if (loans[i].borrower == msg.sender) {
  //       loansSenderBorrowing += 1;
  //     }
  //   }

  //   loansToReturn = new Loan[](loansSenderBorrowing);

  //   for (uint256 i = 1; i <= numOfAllLoans; i++) {
  //     if (loans[i].borrower == msg.sender) {
  //       loansToReturn[currentIndex] = loans[i];
  //       currentIndex += 1;
  //     }
  //   }

  //   return loansToReturn;
  //  }
}