// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DataToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DataRegistry is Ownable {
    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        string dataHash;
        string irysTransactionId;
        string imageUrl;
        string description;
        address creator;
        uint256 createdAt;
        uint256 price;
    }
    
    mapping(string => address) public dataHashToToken;
    mapping(string => address) public irysIdToToken;
    mapping(address => TokenInfo) public tokenInfo;
    address[] public allTokens;
    mapping(address => address[]) public creatorTokens;
    
    event TokenCreated(
        address indexed tokenAddress,
        string indexed dataHash,
        string indexed irysTransactionId,
        address creator,
        string name,
        string symbol
    );
    
    uint256 public constant TOKEN_CREATION_COST = 0.0001 ether; // 0.0001 IRYS tokens
    
    constructor() Ownable(msg.sender) {}
    
    function createDataToken(
        string memory _name,
        string memory _symbol,
        string memory _dataHash,
        string memory _irysTransactionId,
        string memory _imageUrl,
        string memory _description,
        uint256 _initialPrice
    ) external payable returns (address) {
        require(msg.value >= TOKEN_CREATION_COST, "Insufficient payment for token creation");
        require(dataHashToToken[_dataHash] == address(0), "Data already tokenized");
        require(irysIdToToken[_irysTransactionId] == address(0), "Irys transaction already tokenized");
        
        DataToken newToken = new DataToken(
            _name,
            _symbol,
            _dataHash,
            _irysTransactionId,
            _imageUrl,
            _description,
            _initialPrice,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        
        dataHashToToken[_dataHash] = tokenAddress;
        irysIdToToken[_irysTransactionId] = tokenAddress;
        
        tokenInfo[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            name: _name,
            symbol: _symbol,
            dataHash: _dataHash,
            irysTransactionId: _irysTransactionId,
            imageUrl: _imageUrl,
            description: _description,
            creator: msg.sender,
            createdAt: block.timestamp,
            price: _initialPrice
        });
        
        allTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        emit TokenCreated(tokenAddress, _dataHash, _irysTransactionId, msg.sender, _name, _symbol);
        
        return tokenAddress;
    }
    
    function getAllTokens() external view returns (TokenInfo[] memory) {
        TokenInfo[] memory tokens = new TokenInfo[](allTokens.length);
        for (uint256 i = 0; i < allTokens.length; i++) {
            tokens[i] = tokenInfo[allTokens[i]];
        }
        return tokens;
    }
    
    function getTokensByCreator(address _creator) external view returns (TokenInfo[] memory) {
        address[] memory creatorTokenList = creatorTokens[_creator];
        TokenInfo[] memory tokens = new TokenInfo[](creatorTokenList.length);
        for (uint256 i = 0; i < creatorTokenList.length; i++) {
            tokens[i] = tokenInfo[creatorTokenList[i]];
        }
        return tokens;
    }
    
    function searchTokens(string memory _query) external view returns (TokenInfo[] memory) {
        // Simple search implementation - in production, use more sophisticated search
        TokenInfo[] memory allTokensInfo = new TokenInfo[](allTokens.length);
        uint256 matchCount = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            TokenInfo memory token = tokenInfo[allTokens[i]];
            if (contains(token.name, _query) || contains(token.symbol, _query) || contains(token.description, _query)) {
                allTokensInfo[matchCount] = token;
                matchCount++;
            }
        }
        
        TokenInfo[] memory matchedTokens = new TokenInfo[](matchCount);
        for (uint256 i = 0; i < matchCount; i++) {
            matchedTokens[i] = allTokensInfo[i];
        }
        
        return matchedTokens;
    }
    
    function contains(string memory _str, string memory _substr) internal pure returns (bool) {
        bytes memory strBytes = bytes(_str);
        bytes memory substrBytes = bytes(_substr);
        
        if (substrBytes.length > strBytes.length) {
            return false;
        }
        
        for (uint256 i = 0; i <= strBytes.length - substrBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < substrBytes.length; j++) {
                if (strBytes[i + j] != substrBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }
        
        return false;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}