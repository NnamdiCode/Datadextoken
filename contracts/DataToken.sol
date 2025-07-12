// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title DataToken
 * @dev ERC20 token representing ownership of data stored on Irys blockchain
 */
contract DataToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    
    // Data-specific properties
    string public dataHash;        // Irys transaction ID
    string public metadata;        // JSON metadata about the data
    address public creator;        // Original data uploader
    uint256 public createdAt;      // Timestamp when token was created
    
    // Access control
    bool public isTransferable = true;
    mapping(address => bool) public authorizedMinters;
    
    event DataTokenCreated(address indexed creator, string dataHash, uint256 timestamp);
    event MetadataUpdated(string oldMetadata, string newMetadata);
    event TransferabilityChanged(bool isTransferable);

    modifier onlyCreator() {
        require(msg.sender == creator, "DataToken: caller is not the creator");
        _;
    }

    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == creator, "DataToken: not authorized to mint");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _dataHash,
        string memory _metadata,
        address _creator
    ) {
        name = _name;
        symbol = _symbol;
        dataHash = _dataHash;
        metadata = _metadata;
        creator = _creator;
        createdAt = block.timestamp;
        
        // Mint initial supply to creator
        _totalSupply = 1000000 * 10**decimals; // 1M tokens
        _balances[_creator] = _totalSupply;
        
        // Creator is authorized minter by default
        authorizedMinters[_creator] = true;
        
        emit Transfer(address(0), _creator, _totalSupply);
        emit DataTokenCreated(_creator, _dataHash, block.timestamp);
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        require(isTransferable, "DataToken: token is not transferable");
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(isTransferable, "DataToken: token is not transferable");
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public onlyAuthorizedMinter {
        require(to != address(0), "DataToken: mint to the zero address");

        _totalSupply += amount;
        unchecked {
            _balances[to] += amount;
        }
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) public {
        address owner = msg.sender;
        require(_balances[owner] >= amount, "DataToken: burn amount exceeds balance");

        unchecked {
            _balances[owner] -= amount;
            _totalSupply -= amount;
        }
        emit Transfer(owner, address(0), amount);
    }

    function updateMetadata(string memory _newMetadata) public onlyCreator {
        string memory oldMetadata = metadata;
        metadata = _newMetadata;
        emit MetadataUpdated(oldMetadata, _newMetadata);
    }

    function setTransferable(bool _isTransferable) public onlyCreator {
        isTransferable = _isTransferable;
        emit TransferabilityChanged(_isTransferable);
    }

    function authorizeMinter(address minter) public onlyCreator {
        authorizedMinters[minter] = true;
    }

    function revokeMinter(address minter) public onlyCreator {
        require(minter != creator, "DataToken: cannot revoke creator");
        authorizedMinters[minter] = false;
    }

    // View functions for data information
    function getDataInfo() public view returns (
        string memory _dataHash,
        string memory _metadata,
        address _creator,
        uint256 _createdAt,
        bool _isTransferable
    ) {
        return (dataHash, metadata, creator, createdAt, isTransferable);
    }

    function getTokenInfo() public view returns (
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        return (name, symbol, decimals, _totalSupply);
    }

    // Internal functions
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "DataToken: transfer from the zero address");
        require(to != address(0), "DataToken: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "DataToken: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "DataToken: approve from the zero address");
        require(spender != address(0), "DataToken: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "DataToken: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}
