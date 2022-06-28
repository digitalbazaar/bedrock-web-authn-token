/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as base64url from 'base64url-universal';
import crypto from './crypto.js';

const ALGORITHM = {name: 'PBKDF2'};
const EXTRACTABLE = false;
const KEY_USAGE = ['deriveBits', 'deriveKey'];

const subtle = _getCryptoSubtle();
const getRandomValues = _getRandomValues();

export async function pbkdf2({
  secret, salt, iterations = 100000, bitLength = 512, saltSize = 16
}) {
  if(typeof secret !== 'string') {
    throw new TypeError('"secret" must be a string.');
  }
  if(typeof secret !== 'string') {
    throw new TypeError('"secret" must be a string.');
  }
  // parse and impose minimum iterations
  iterations = parseInt(iterations, 10);
  if(isNaN(iterations) || iterations < 5000) {
    throw new Error(`Unsupported PBKDF2 iterations "${iterations}".`);
  }

  if(salt !== undefined) {
    if(typeof salt === 'string') {
      // parse string from base64-no-pad encoding
      salt = _fromBase64NoPad(salt);
    } else if(!(salt instanceof Uint8Array)) {
      throw new TypeError('"salt" must be a Uint8Array.');
    }
  } else {
    // generate salt
    salt = await getRandomValues(new Uint8Array(saltSize));
  }

  const kdk = await subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    ALGORITHM, EXTRACTABLE, KEY_USAGE);

  const algorithm = {
    ...ALGORITHM,
    salt,
    iterations,
    hash: 'SHA-512'
  };
  const derivedBits = new Uint8Array(await subtle.deriveBits(
    algorithm, kdk, bitLength));
  const newPhc = {
    id: 'pbkdf2-sha512',
    params: {i: iterations},
    salt: _toBase64NoPad(salt),
    hash: _toBase64NoPad(derivedBits)
  };
  const hash = _serializePhc({phc: newPhc});
  return {algorithm, salt, derivedBits, hash, phc: newPhc};
}

// password hashing competition (PHC) format
// https://github.com/P-H-C/phc-string-format
function _serializePhc({phc}) {
  // e.g. $pbkdf2-sha512$i=<iterations>$<base64 salt>$<base64 derivedBits>
  const {id, params, salt, hash} = phc;
  const paramString = Object.entries(params).map(kv => kv.join('=')).join(',');
  const b64Salt = typeof salt === 'string' ? salt : _toBase64NoPad(salt);
  const b64Hash = typeof hash === 'string' ? hash : _toBase64NoPad(hash);
  return `$${id}$${paramString}$${b64Salt}$${b64Hash}`;
}

function _fromBase64NoPad(string) {
  return base64url.decode(string.replace(/\+/g, '-').replace(/\//, '_'));
}

function _toBase64NoPad(buffer) {
  return base64url.encode(buffer).replace(/-/g, '+').replace(/_/g, '/');
}

function _getCryptoSubtle() {
  const subtle = crypto?.webcrypto?.subtle ?? crypto?.subtle ?? {};
  if(subtle.importKey) {
    return subtle;
  }

  const _pbkdf2 = async function(...args) {
    return new Promise((resolve, reject) =>
      crypto.pbkdf2(
        ...args, (err, result) => err ? reject(err) : resolve(result)));
  };

  // local polyfill supports just `pbkdf2`
  subtle.importKey = async function importKey(format, secret) {
    return {format, secret};
  };
  subtle.deriveBits = async function deriveBits(algorithm, key, bitLength) {
    const {secret} = key;
    const {salt, iterations} = algorithm;
    const byteLength = bitLength / 8;
    if(algorithm.hash !== 'SHA-512') {
      throw new Error(`Unsupported hash algorithm "${algorithm.hash}".`);
    }
    const hash = 'sha512';
    const derivedKey = await _pbkdf2(
      secret, salt, iterations, byteLength, hash);
    // clear secret
    secret.fill(0);
    return new Uint8Array(derivedKey);
  };

  return subtle;
}

function _getRandomValues() {
  if(crypto?.getRandomValues) {
    return crypto.getRandomValues.bind(crypto);
  }

  if(crypto?.webcrypto?.getRandomValues) {
    return crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
  }

  if(crypto.randomFill) {
    return async function randomFill(x) {
      return new Promise((resolve, reject) =>
        crypto.randomFill(
          x, (err, result) => err ? reject(err) : resolve(result)));
    };
  }

  throw new Error(
    'Web Crypto "getRandomValues" or "crypto.randomFill" required.');
}
