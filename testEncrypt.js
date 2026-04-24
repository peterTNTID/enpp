/**
 * testEncrypt.js - Encrypt a message using the bundled PGP/RSA public key.
 *
 * Usage:
 *   node testEncrypt.js "your secret message"
 *   node testEncrypt.js                        (uses default test message)
 *
 * The public key is read from testEncrypt_pubkey.asc in the same directory.
 * Requires: npm install openpgp
 */

var openpgp = require("openpgp");
var fs = require("fs");
var path = require("path");

var PUBLIC_KEY_PATH = path.join(__dirname, "testEncrypt_pubkey.asc");

async function encryptMessage(plaintext) {
  var armoredKey = fs.readFileSync(PUBLIC_KEY_PATH, "utf8").trim();
  var publicKey = await openpgp.readKey({ armoredKey: armoredKey });
  var pgpMessage = await openpgp.createMessage({ text: plaintext });

  return openpgp.encrypt({
    message: pgpMessage,
    encryptionKeys: publicKey,
  });
}

// --- Main ---
var message = process.argv[2] || "Hello, this is a test message!";

console.log('Encrypting: "' + message + '"');

encryptMessage(message)
  .then(function (encrypted) {
    console.log("\nEncrypted PGP message:\n");
    console.log(encrypted);
  })
  .catch(function (err) {
    console.error("Encryption failed: " + err.message);
    process.exit(1);
  });
