//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC721.sol";

contract NFTManager is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event IdentityTokenAssigned(address user);
    event IdentityTokenRemoved(address user);

    constructor() ERC721("PersonalIdentityToken", "PIT") {}

    function create(string memory cid) external returns (uint256) {
        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _safeMint(msg.sender, id);
        _setTokenURI(id, cid);

        emit IdentityTokenAssigned(msg.sender);

        return id;
    }

    function get() external view returns (uint256) {
        return _nft[msg.sender];
    }

    function remove() external {
        uint256 tokenId = _nft[msg.sender];
        _burn(tokenId);

        emit IdentityTokenRemoved(msg.sender);
    }
}
