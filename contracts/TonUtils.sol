pragma solidity ^0.8.9;

interface TonUtils {
    struct TonAddress {
        int8 workchain;
        bytes32 address_hash;
    }

    struct TonTxID {
        TonAddress address_;
        bytes32 tx_hash;
        uint64 lt;
    }

    struct SwapData {
        address receiver;
        address token;
        uint64 amount;
        TonTxID tx;
    }

    struct Signature {
        address signer;
        bytes signature;
    }
}
