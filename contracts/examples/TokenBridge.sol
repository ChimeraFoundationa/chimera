// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// NOTE: This is a simplified example. In a real project, you would install OpenZeppelin
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

// For this self-contained example, we'll create a minimal ERC20-like contract.
contract MinimalERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _supply) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        totalSupply = _supply;
        balanceOf[msg.sender] = _supply;
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
}

contract TokenBridge is MinimalERC20 {
    mapping(uint256 => bool) public supportedChains;
    
    event BridgeMinted(address indexed to, uint256 amount, uint256 sourceChainId);
    event BridgeBurned(address indexed from, uint256 amount, uint256 targetChainId);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) MinimalERC20(_name, _symbol, _initialSupply) {}
    
    function addSupportedChain(uint256 chainId) external {
        // In a real contract, this would be restricted to an owner role
        supportedChains[chainId] = true;
    }
    
    function bridgeMint(
        address to,
        uint256 amount,
        uint256 sourceChainId
    ) external {
        require(supportedChains[sourceChainId], "Source chain not supported");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit BridgeMinted(to, amount, sourceChainId);
    }
    
    function bridgeBurn(uint256 amount, uint256 targetChainId) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit BridgeBurned(msg.sender, amount, targetChainId);
    }
}
