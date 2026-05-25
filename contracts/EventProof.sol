// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * EventProof — 怀仁堂事件链上存证合约
 *
 * 用途：将新闻事件的 sha256 内容哈希写入 Sepolia 测试网，
 * 形成不可篡改的时序记录。每条哈希对应一篇新闻事件的标准化摘要。
 *
 * 部署方式：Remix (remix.ethereum.org) + MetaMask (Sepolia 测试网)
 */
contract EventProof {
    address public owner;

    struct EventRecord {
        bytes32 contentHash;
        uint256 timestamp;    // block.timestamp，UTC Unix 秒
        string  metadataUri;  // 预留字段，当前传 ""，未来可指向 IPFS
        bool    exists;
    }

    // 哈希 → 记录，O(1) 查询
    mapping(bytes32 => EventRecord) public records;

    // 有序索引，用于枚举全部已存证条目
    bytes32[] public hashIndex;

    event EventStored(
        bytes32 indexed contentHash,
        uint256         timestamp,
        string          metadataUri
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * 存证单条事件哈希
     * @param contentHash  sha256(标准化事件JSON) 的 bytes32 表示
     * @param metadataUri  元数据 URI，当前传空字符串即可
     */
    function storeEventHash(bytes32 contentHash, string calldata metadataUri)
        external
        onlyOwner
    {
        require(!records[contentHash].exists, "Already stored");
        records[contentHash] = EventRecord({
            contentHash: contentHash,
            timestamp:   block.timestamp,
            metadataUri: metadataUri,
            exists:      true
        });
        hashIndex.push(contentHash);
        emit EventStored(contentHash, block.timestamp, metadataUri);
    }

    /**
     * 查询某哈希是否已存证
     * @param contentHash  待查哈希
     */
    function getEvent(bytes32 contentHash)
        external
        view
        returns (uint256 timestamp, string memory metadataUri, bool exists)
    {
        EventRecord storage r = records[contentHash];
        return (r.timestamp, r.metadataUri, r.exists);
    }

    /**
     * 返回已存证总条数
     */
    function totalStored() external view returns (uint256) {
        return hashIndex.length;
    }
}
