// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DataToken is ERC20, Ownable {
    string public dataHash;
    string public irysTransactionId;
    string public imageUrl;
    string public description;
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 public price;
    
    event PriceUpdated(uint256 newPrice);
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _dataHash,
        string memory _irysTransactionId,
        string memory _imageUrl,
        string memory _description,
        uint256 _initialPrice,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        dataHash = _dataHash;
        irysTransactionId = _irysTransactionId;
        imageUrl = _imageUrl;
        description = _description;
        price = _initialPrice;
        _mint(_owner, INITIAL_SUPPLY);
    }
    
    function updatePrice(uint256 _newPrice) external onlyOwner {
        price = _newPrice;
        emit PriceUpdated(_newPrice);
    }
    
    function getTokenInfo() external view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        uint256,
        uint256
    ) {
        return (
            dataHash,
            irysTransactionId,
            imageUrl,
            description,
            name(),
            price,
            totalSupply()
        );
    }
}