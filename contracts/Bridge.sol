pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SignatureChecker.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Bridge is SignatureChecker {
    using SafeERC20 for IERC20;
    address[] oracleSet;
    mapping(address => bool) isOracle;
    mapping(bytes32 => bool) public finishedVotings;

    event Lock(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint8 decimals,
        bytes32 name,
        bytes32 symbol,
        int8 workchain,
        bytes32 indexed addressHash
    );
    event Unlock(
        address indexed receiver,
        address indexed token,
        uint256 amount,
        bytes32 indexed txHash
    );
    event NewOracleSet(uint256 oracleSetHash, address[] newOracles);

    struct TokenInfo {
        address token;
        string tokenTicket;
        uint256 decimals;
    }

    constructor(address[] memory initialSet) {
        updateOracleSet(0, initialSet);
    }

    function generalVote(bytes32 digest, Signature[] memory signatures)
        internal
        view
    {
        require(
            signatures.length >= (2 * oracleSet.length) / 3,
            "Not enough signatures"
        );
        require(!finishedVotings[digest], "Vote is already finished");
        uint256 signum = signatures.length;
        uint256 last_signer = 0;
        for (uint256 i = 0; i < signum; i++) {
            address signer = signatures[i].signer;
            require(isOracle[signer], "Unauthorized signer");
            uint256 next_signer = uint256(uint160(signer));
            require(next_signer > last_signer, "Signatures are not sorted");
            last_signer = next_signer;
            checkSignature(digest, signatures[i]);
        }
    }

    function lock(
        address token,
        uint256 amount,
        TonAddress memory tonAddress
    ) public {
        require(token != address(0), "lock: wrong token address");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Lock(
            msg.sender,
            token,
            amount,
            ERC20(token).decimals(),
            bytes32(abi.encodePacked(ERC20(token).name())),
            bytes32(abi.encodePacked(ERC20(token).symbol())),
            tonAddress.workchain,
            tonAddress.address_hash
        );
    }

    function unlock(SwapData memory data, Signature[] memory signatures)
        public
    {
        require(msg.sender == data.receiver, "unlock: wrong receiver address");
        bytes32 digest = getBurnDataId(data);
        generalVote(digest, signatures);
        finishedVotings[digest] = true;
        IERC20(data.token).transfer(data.receiver, data.amount);
        emit Unlock(data.receiver, data.token, data.amount, data.tx.tx_hash);
    }

    function voteForNewOracleSet(
        uint256 oracleSetHash,
        address[] memory newOracles,
        Signature[] memory signatures
    ) public {
        bytes32 _id = getNewSetId(oracleSetHash, newOracles);
        generalVote(_id, signatures);
        finishedVotings[_id] = true;
        updateOracleSet(oracleSetHash, newOracles);
    }

    function updateOracleSet(uint256 oracleSetHash, address[] memory newOracles)
        internal
    {
        require(newOracles.length > 2, "New set is too short");
        uint256 oldSetLen = oracleSet.length;
        for (uint256 i = 0; i < oldSetLen; i++) {
            isOracle[oracleSet[i]] = false;
        }
        oracleSet = newOracles;
        uint256 newSetLen = oracleSet.length;
        for (uint256 i = 0; i < newSetLen; i++) {
            isOracle[newOracles[i]] = true;
        }
        emit NewOracleSet(oracleSetHash, newOracles);
    }

    function getOracleSet() public view returns (address[] memory) {
        return oracleSet;
    }
}
