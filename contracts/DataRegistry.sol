// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DataToken.sol";

/**
 * @title DataRegistry
 * @dev Registry for managing data tokens and their associated metadata
 */
contract DataRegistry {
    struct TokenInfo {
        address tokenAddress;
        string dataHash;
        address creator;
        uint256 createdAt;
        bool isActive;
    }

    mapping(string => address) public dataHashToToken; // dataHash => token address
    mapping(address => TokenInfo) public tokenInfo;    // token address => token info
    mapping(address => address[]) public creatorTokens; // creator => token addresses
    
    address[] public allTokens;
    uint256 public tokenCount;
    
    // Access control
    address public owner;
    mapping(address => bool) public authorizedCreators;
    bool public openCreation = true; // Anyone can create tokens
    
    event DataTokenCreated(
        address indexed token, 
        string dataHash, 
        address indexed creator, 
        uint256 timestamp
    );
    event TokenActivated(address indexed token, bool isActive);
    event CreatorAuthorized(address indexed creator, bool authorized);
    event OpenCreationToggled(bool openCreation);

    modifier onlyOwner() {
        require(msg.sender == owner, "DataRegistry: caller is not the owner");
        _;
    }

    modifier onlyAuthorizedCreator() {
        require(
            openCreation || authorizedCreators[msg.sender] || msg.sender == owner,
            "DataRegistry: not authorized to create tokens"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedCreators[msg.sender] = true;
    }

    /**
     * @dev Create a new data token
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param dataHash The Irys transaction ID of the stored data
     * @param metadata JSON metadata about the data
     */
    function createDataToken(
        string memory name,
        string memory symbol,
        string memory dataHash,
        string memory metadata
    ) public onlyAuthorizedCreator returns (address) {
        require(bytes(dataHash).length > 0, "DataRegistry: dataHash cannot be empty");
        require(dataHashToToken[dataHash] == address(0), "DataRegistry: token already exists for this data");
        
        // Create new data token
        DataToken newToken = new DataToken(
            name,
            symbol,
            dataHash,
            metadata,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        
        // Register the token
        dataHashToToken[dataHash] = tokenAddress;
        tokenInfo[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            dataHash: dataHash,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });
        
        creatorTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        tokenCount++;
        
        emit DataTokenCreated(tokenAddress, dataHash, msg.sender, block.timestamp);
        
        return tokenAddress;
    }

    /**
     * @dev Get token address by data hash
     */
    function getDataToken(string memory dataHash) public view returns (address) {
        return dataHashToToken[dataHash];
    }

    /**
     * @dev Get all token addresses
     */
    function getAllTokens() public view returns (address[] memory) {
        return allTokens;
    }

    /**
     * @dev Get tokens created by a specific address
     */
    function getTokensByCreator(address creator) public view returns (address[] memory) {
        return creatorTokens[creator];
    }

    /**
     * @dev Get paginated list of tokens
     */
    function getTokensPaginated(uint256 offset, uint256 limit) 
        public view returns (address[] memory tokens, uint256 total) {
        total = allTokens.length;
        
        if (offset >= total) {
            return (new address[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        tokens = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            tokens[i - offset] = allTokens[i];
        }
        
        return (tokens, total);
    }

    /**
     * @dev Check if an address is a valid registered token
     */
    function isValidToken(address token) public view returns (bool) {
        return tokenInfo[token].tokenAddress != address(0) && tokenInfo[token].isActive;
    }

    /**
     * @dev Get detailed token information
     */
    function getTokenDetails(address token) public view returns (
        string memory dataHash,
        address creator,
        uint256 createdAt,
        bool isActive,
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) {
        require(tokenInfo[token].tokenAddress != address(0), "DataRegistry: token not found");
        
        TokenInfo memory info = tokenInfo[token];
        DataToken dataToken = DataToken(token);
        
        return (
            info.dataHash,
            info.creator,
            info.createdAt,
            info.isActive,
            dataToken.name(),
            dataToken.symbol(),
            dataToken.totalSupply()
        );
    }

    /**
     * @dev Search tokens by creator or data hash
     */
    function searchTokens(string memory query) public view returns (address[] memory) {
        // This is a simple implementation - in production, you might want to use a more sophisticated search
        address[] memory results = new address[](allTokens.length);
        uint256 resultCount = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            address token = allTokens[i];
            TokenInfo memory info = tokenInfo[token];
            
            if (info.isActive && 
                (keccak256(bytes(info.dataHash)) == keccak256(bytes(query)))) {
                results[resultCount] = token;
                resultCount++;
            }
        }
        
        // Return only the filled results
        address[] memory finalResults = new address[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            finalResults[i] = results[i];
        }
        
        return finalResults;
    }

    /**
     * @dev Activate/deactivate a token (only owner or creator)
     */
    function setTokenActive(address token, bool isActive) public {
        require(tokenInfo[token].tokenAddress != address(0), "DataRegistry: token not found");
        require(
            msg.sender == owner || msg.sender == tokenInfo[token].creator,
            "DataRegistry: not authorized"
        );
        
        tokenInfo[token].isActive = isActive;
        emit TokenActivated(token, isActive);
    }

    /**
     * @dev Authorize/unauthorize a creator (only owner)
     */
    function setCreatorAuthorization(address creator, bool authorized) public onlyOwner {
        authorizedCreators[creator] = authorized;
        emit CreatorAuthorized(creator, authorized);
    }

    /**
     * @dev Toggle open creation (only owner)
     */
    function setOpenCreation(bool _openCreation) public onlyOwner {
        openCreation = _openCreation;
        emit OpenCreationToggled(_openCreation);
    }

    /**
     * @dev Transfer ownership (only owner)
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "DataRegistry: new owner is the zero address");
        owner = newOwner;
        authorizedCreators[newOwner] = true;
    }

    /**
     * @dev Get registry statistics
     */
    function getStats() public view returns (
        uint256 totalTokens,
        uint256 activeTokens,
        uint256 totalCreators
    ) {
        totalTokens = allTokens.length;
        
        // Count active tokens and unique creators
        mapping(address => bool) uniqueCreators;
        uint256 creatorCount = 0;
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allTokens.length; i++) {
            TokenInfo memory info = tokenInfo[allTokens[i]];
            
            if (info.isActive) {
                activeCount++;
            }
            
            if (!uniqueCreators[info.creator]) {
                uniqueCreators[info.creator] = true;
                creatorCount++;
            }
        }
        
        return (totalTokens, activeCount, creatorCount);
    }
}
