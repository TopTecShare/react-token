//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "./ERC721.sol";

contract PersonalIdentityToken is ERC721, ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    IERC20 public constant linkToken = IERC20(0xa36085F69e2889c224210F603D836748e7dC0088); // Kovan
    bytes32 public constant jobId = "7a97ff8493ec406d90621b2531f9251a";
    uint256 public constant fee = 0.1 * 10 ** 18;

    event IdentityTokenAssigned(address user);
    event IdentityTokenRemoved(address user);

    address public user;
    string public cid;
    string public baseUrl;

    constructor() ERC721("Personal Identity Token", "PIT") {
        setChainlinkToken(address(linkToken));
        setChainlinkOracle(0xc57B33452b4F7BB189bB5AfaE9cc4aBa1f7a4FD8);
        baseUrl = "http://legalattorney.xyz/create";
    }

    function create(string memory firstName, string memory lastName, string memory email) external {
        require(linkToken.balanceOf(address(this)) >= fee, "Not enough LINK");
        require(_nft[msg.sender] == 0, "Only one token per wallet allowed");

        string memory url = craftUrl(baseUrl, firstName, lastName, email);

        user = msg.sender; // @todo to be removed

        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.mintTokenCallback.selector);
        req.add("get", url);
        req.add("path", "data");
        requestOracleData(req, fee);
    }

    function mintTokenCallback(bytes32 requestId, bytes memory bytesData) public recordChainlinkFulfillment(requestId) {
        cid = string(bytesData);
        /*
         * @todo For a future implementation: check the user address
         */
         /*
        string memory addr = string(addressRes);
        address user = Utils.toAddress(addr);
        *
        */

        _tokenIds.increment();
        uint256 id = _tokenIds.current();
        _safeMint(user, id);
        _setTokenURI(id, cid);

        emit IdentityTokenAssigned(user);
    }

    function get(address person) external view returns (uint256) {
        return _nft[person];
    }

    function remove() external {
        uint256 tokenId = _nft[msg.sender];
        _burn(tokenId);

        emit IdentityTokenRemoved(msg.sender);
    }

    function withdrawLink() external onlyOwner {
        uint256 amount = linkToken.balanceOf(address(this));
        linkToken.transfer(msg.sender, amount);
    }

    function setBaseUrl(string memory url) external onlyOwner {
        baseUrl = url;
    }

    function craftUrl(string memory base, string memory firstName, string memory lastName, string memory email) internal view returns(string memory) {
        string memory url = concatenate(base, "?firstName=");
        url = concatenate(url, firstName);
        url = concatenate(url, "&lastName=");
        url = concatenate(url, lastName);
        url = concatenate(url, "&email=");
        url = concatenate(url, email);

        return url;
    }

    function concatenate(string memory s1, string memory s2) internal pure returns (string memory) {
        return string(abi.encodePacked(s1, s2));
    }
}
