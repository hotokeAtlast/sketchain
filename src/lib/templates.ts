export const TEMPLATES: Record<string, string> = {
  Ownable: `abstract contract Ownable {
    address public owner;
    event OwnershipTransferred(address indexed from, address indexed to);
    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    constructor() { owner = msg.sender; }
}`,
  "ERC20 (minimal)": `contract MyToken {
    string public name = "MyToken";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    event Transfer(address indexed from, address indexed to, uint256 value);

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}`,
  Pausable: `abstract contract Pausable {
    bool public paused;
    event Paused(address account);
    modifier whenNotPaused() { require(!paused, "paused"); _; }
    function _pause() internal { paused = true; emit Paused(msg.sender); }
}`,
}
