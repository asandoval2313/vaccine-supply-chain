// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

library SigLibrary {
    function splitSginature(bytes memory sig) internal pure returns(uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65);

        assembly {
            r := mload(add(sig, 32))

            s := mload(add(sig, 64))

            v := byte(0, mload(add(sig, 96)))
        }

        return(v,r,s);
    }

    // Recovers signer using ecrecover
    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSginature(sig);
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, message));

        // Ecrecover uses the points defined by r and s to decompile the message signer 
        return ecrecover(prefixedHash, v, r, s);
    }
}

contract ColdChain {
    
    // Types of entities
    enum Mode { ISSUER, PROVER, VERIFIER }
    // Vaccine batch statuses
    enum Status { MANUFACTURED, DELIVERING_INTERNATIONAL, STORED, DELIVERING_LOCAL, DELIVERED }

    struct Entity {
        address id; 
        Mode mode; 
        uint[] certificateIds;
    }
    
    struct Certificate {
        uint id; 
        Entity issuer; 
        Entity prover; 
        bytes signature;
        Status status;
    }

    struct VaccineBatch {
        uint id; 
        string brand; 
        address manufacturer; 
        uint[] certificateIds;
    }

    uint public constant MAX_CERTIFICATIONS = 2;

    uint[] public certificateIds;
    uint[] public vaccineBactchIds;

    mapping(uint => VaccineBatch) public vaccineBatches;
    mapping(uint => Certificate) public certificates; 
    mapping(address => Entity) public entities; 

    event AddEntity(address entityId, string entityMode);
    event AddVaccineBatch(uint vaccineBatchId, address indexed manufacturer);
    event IssueCertificate(address indexed issuer, address indexed prover, uint certificateId);

    function addEntity(address _id, string memory _mode) public {
        Mode mode = unmarshalMode(_mode);
        uint[] memory _certificateIds = new uint[](MAX_CERTIFICATIONS);
        Entity memory entity = Entity(_id, mode, _certificateIds);
        entities[_id] = entity;
        emit AddEntity(entity.id, _mode);
    }

    function unmarshalMode(string memory _mode) private pure returns(Mode mode){
        // Unmarshals Mode enum and compares to passed Mode to give entity a role
        bytes32 encodedMode = keccak256(abi.encodePacked(_mode));
        bytes32 encodedMode0 = keccak256(abi.encodePacked("ISSUER"));
        bytes32 encodedMode1 = keccak256(abi.encodePacked("PROVER"));
        bytes32 encodedMode2 = keccak256(abi.encodePacked("VERIFIER"));

        /* 
        Tried to find way to clean up code with for loop 
        but was unable to find way to loop over enums.
        */
        if (encodedMode == encodedMode0) {
            return Mode.ISSUER;
        } 
        else if (encodedMode == encodedMode1) {
            return Mode.PROVER;
        } 
        else if (encodedMode == encodedMode2) {
            return Mode.VERIFIER;
        } else {
            revert("received invalid entity mode");
        }
    }
    
    function addVaccineBatch(string memory brand, address manufacturer) public returns(uint){
        uint[] memory _certificateIds = new uint[](MAX_CERTIFICATIONS);
        uint id = vaccineBactchIds.length;
        VaccineBatch memory batch = VaccineBatch(id, brand, manufacturer, _certificateIds);
        vaccineBatches[id] = batch;
        vaccineBactchIds.push(id);
        emit AddVaccineBatch(batch.id, batch.manufacturer);

        return id; 
    }

    function issueCertificate(
        address _issuer, address _prover, string memory _status,
        bytes memory signature) public returns(uint) {
            
            Entity memory issuer = entities[_issuer];
            require(issuer.mode == Mode.ISSUER);

            Entity memory prover = entities[_prover];
            require(prover.mode == Mode.PROVER);

            Status status = unmarshalStatus(_status);

            uint id = certificateIds.length;
            Certificate memory certificate = Certificate(id, issuer, prover, signature, status);

            certificateIds.push(certificateIds.length);
            certificates[certificateIds.length - 1] = certificate;

            emit IssueCertificate(_issuer, _prover, certificateIds.length-1);
            return certificateIds.length-1;
    }

    function unmarshalStatus(string memory _status) private pure returns(Status status){
        bytes32 encodedStatus = keccak256(abi.encodePacked(_status));
        bytes32 encodedStatus0 = keccak256(abi.encodePacked("MANUFACTURED"));
        bytes32 encodedStatus1 = keccak256(abi.encodePacked("DELIVERING_INTERNATIONAL"));
        bytes32 encodedStatus2 = keccak256(abi.encodePacked("STORED"));
        bytes32 encodedStatus3 = keccak256(abi.encodePacked("DELIVERING_LOCAL"));
        bytes32 encodedStatus4 = keccak256(abi.encodePacked("DELIVERED"));

        if (encodedStatus == encodedStatus0) {
            return Status.MANUFACTURED;
        } 
        else if (encodedStatus == encodedStatus1) {
            return Status.DELIVERING_INTERNATIONAL;
        } 
        else if (encodedStatus == encodedStatus2) {
            return Status.STORED;
        } 
        else if (encodedStatus == encodedStatus3) {
            return Status.DELIVERING_LOCAL;
        } 
        else if (encodedStatus == encodedStatus4) {
            return Status.DELIVERED;
        } else {
            revert("received invalid certificate status");
        }
    }

    function isMatchingSignature(bytes32 message, uint id, address issuer) public view returns(bool) {
        Certificate memory cert = certificates[id];
        require(cert.issuer.id == issuer);

        address recoveredSigner = SigLibrary.recoverSigner(message, cert.signature);

        return recoveredSigner == cert.issuer.id;
    }

}