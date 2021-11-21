# Avoiding Commmon Attacks

## SWC-100 Visibility Not Set

Attempted to always provide a visibility to prevent unintended use of functions.

## SWC-103 Floating pragma

Set compiler pragma to a fixed version of `0.8.4` to prevent using incompatible functions.

## SWC-107 Unchecked Call Return Value

Using Openzeppelin's ReentrancyGuard to protect methods from reentry.  
