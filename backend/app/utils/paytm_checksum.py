import base64
import string
import random
import hashlib
import hmac

class PaytmChecksum:
    """
    Paytm Checksum utility for generating and verifying cryptographic signatures
    in accordance with official Paytm Payment Gateway specifications.
    Uses SHA256 HMAC encryption with the merchant secret key.
    """

    @staticmethod
    def generate_signature(params, key):
        if not isinstance(params, (dict, str)):
            raise TypeError("params must be dictionary or string")
        if isinstance(params, dict):
            params = PaytmChecksum.get_string_by_params(params)
        return PaytmChecksum.generate_signature_by_string(params, key)

    @staticmethod
    def verify_signature(params, key, checksum):
        if not isinstance(params, (dict, str)):
            raise TypeError("params must be dictionary or string")
        if not checksum:
            return False
        if isinstance(params, dict):
            params = PaytmChecksum.get_string_by_params(params)
        return PaytmChecksum.verify_signature_by_string(params, key, checksum)

    @staticmethod
    def generate_signature_by_string(params, key):
        salt = PaytmChecksum.generate_random_string(4)
        return PaytmChecksum.calculate_hash(params, key, salt)

    @staticmethod
    def verify_signature_by_string(params, key, checksum):
        if not checksum or len(checksum) < 4:
            return False
        # Salt is the last 4 characters in standard Paytm checksum
        salt = checksum[-4:]
        calculated = PaytmChecksum.calculate_hash(params, key, salt)
        return hmac.compare_digest(calculated, checksum)

    @staticmethod
    def calculate_hash(params, key, salt):
        final_string = f"{params}|{salt}"
        hash_obj = hashlib.sha256(final_string.encode('utf-8'))
        hasher = hmac.new(key.encode('utf-8'), hash_obj.digest(), hashlib.sha256)
        hash_signature = hasher.hexdigest()
        return f"{hash_signature}{salt}"

    @staticmethod
    def generate_random_string(length):
        chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
        return ''.join(random.choice(chars) for _ in range(length))

    @staticmethod
    def get_string_by_params(params):
        """Sort parameters alphabetically by key and concatenate values with pipe delimiter."""
        sorted_keys = sorted(params.keys())
        string_builder = []
        for key in sorted_keys:
            # Exclude checksum or signature fields themselves
            if key in ('CHECKSUMHASH', 'checksum', 'signature'):
                continue
            val = params[key]
            if val is not None and str(val).lower() != 'null':
                string_builder.append(str(val))
        return '|'.join(string_builder)
