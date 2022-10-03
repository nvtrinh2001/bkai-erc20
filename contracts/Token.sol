// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

error TokenERC20__NotEnoughTokens(uint256 failedValue, address user);
error TokenERC20__NotEnoughAllowance(
  uint256 failedValue,
  address allowingUser,
  address spender
);
error TokenERC20__ZeroAddressNotAllowed();
error TokenERC20__NotOwner(address actualUser);
error TokenERC20__LockedAddress(address lockedAddress);

contract TokenERC20 {
  // public variables will auto-generate getter functions
  string public name;
  string public symbol;
  uint8 public decimals = 18;
  uint256 public totalSupply;
  address private _owner;

  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;
  mapping(address => bool) public lockingState;

  event Transfer(uint256 value, address indexed from, address indexed to);
  event Approval(uint256 value, address indexed from, address indexed to);
  event Burn(address indexed from, uint256 value);
  event OwnershipTransferred(address oldOwner, address newOwner);

  constructor(
    uint256 initialSupply,
    string memory tokenName,
    string memory tokenSymbol
  ) {
    totalSupply = initialSupply * 10**uint256(decimals);
    balanceOf[msg.sender] = totalSupply;
    name = tokenName;
    symbol = tokenSymbol;
    _owner = msg.sender;
  }

  modifier onlyOwner() {
    if (msg.sender != _owner) revert TokenERC20__NotOwner(msg.sender);
    _;
  }

  modifier onlyUnlockedAddressAllowed(address _from) {
    if (lockingState[_from]) revert TokenERC20__LockedAddress(_from);
    _;
  }

  function lockAccount(address _account)
    public
    onlyOwner
    returns (bool success)
  {
    lockingState[_account] = true;
    return true;
  }

  function _transfer(
    uint256 _value,
    address _from,
    address _to
  ) internal {
    if (_to == address(0x0) || _from == address(0x0))
      revert TokenERC20__ZeroAddressNotAllowed();
    if (balanceOf[_from] < _value)
      revert TokenERC20__NotEnoughTokens(balanceOf[_from], _from);
    balanceOf[_to] += _value;
    balanceOf[_from] -= _value;
    emit Transfer(_value, _from, _to);
  }

  function transfer(uint256 _value, address _to)
    public
    onlyUnlockedAddressAllowed(msg.sender)
    returns (bool success)
  {
    _transfer(_value, msg.sender, _to);
    return true;
  }

  /**
   * Transfer tokens from other address
   *
   * Send `_value` tokens to `_to` on behalf of `_from`
   *
   */
  function transferFrom(
    uint256 _value,
    address _from,
    address _to
  ) public onlyUnlockedAddressAllowed(_from) returns (bool success) {
    if (allowance[_from][msg.sender] < _value)
      revert TokenERC20__NotEnoughAllowance(
        allowance[_from][msg.sender],
        _from,
        msg.sender
      );
    allowance[_from][msg.sender] -= _value;
    _transfer(_value, _from, _to);
    return true;
  }

  /**
   * Set allowance for other address
   *
   * Allows `_spender` to spend no more than `_value` tokens on your behalf
   *
   */
  function approve(uint256 _value, address _spender)
    public
    returns (bool success)
  {
    if (_spender == address(0x0)) revert TokenERC20__ZeroAddressNotAllowed();
    allowance[msg.sender][_spender] = _value;
    emit Approval(_value, msg.sender, _spender);
    return true;
  }

  function burn(uint256 _value) public returns (bool success) {
    if (balanceOf[msg.sender] < _value)
      revert TokenERC20__NotEnoughTokens(balanceOf[msg.sender], msg.sender);
    balanceOf[msg.sender] -= _value;
    totalSupply -= _value;
    emit Burn(msg.sender, _value);
    return true;
  }

  function burnFrom(address _from, uint256 _value)
    public
    returns (bool success)
  {
    if (_from == address(0x0)) revert TokenERC20__ZeroAddressNotAllowed();
    if (balanceOf[_from] < _value)
      revert TokenERC20__NotEnoughTokens(balanceOf[_from], _from);
    if (allowance[_from][msg.sender] < _value)
      revert TokenERC20__NotEnoughAllowance(
        allowance[_from][msg.sender],
        _from,
        msg.sender
      );
    balanceOf[_from] -= _value;
    allowance[_from][msg.sender] -= _value;
    totalSupply -= _value;
    emit Burn(_from, _value);
    return true;
  }

  function owner() public view returns (address) {
    return _owner;
  }

  function abandonOwnership() public onlyOwner returns (bool success) {
    address oldOwner = _owner;
    _owner = address(0x0);
    emit OwnershipTransferred(oldOwner, _owner);
    return true;
  }

  function changeOwnership(address newOwner)
    public
    onlyOwner
    returns (bool success)
  {
    if (newOwner == address(0x0)) revert TokenERC20__ZeroAddressNotAllowed();
    address oldOwner = _owner;
    _owner = newOwner;
    emit OwnershipTransferred(oldOwner, _owner);
    return true;
  }
}
