/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import bcrypt from 'bcryptjs';
import {httpClient} from '@digitalbazaar/http-client';
import {pbkdf2} from './pbkdf2.js';

const TOKEN_TYPES = ['nonce', 'password', 'totp'];
const DEFAULT_HEADERS = {Accept: 'application/ld+json, application/json'};

export class TokenService {
  constructor({
    urls = {
      tokens: '/authn/tokens',
      authenticate: '/authn/token/authenticate',
      login: '/authn/token/login',
      requirements: '/authn/token/requirements',
      registration: '/authn/token/client/registration',
      recovery: '/authn/token/recovery'
    }
  } = {}) {
    this.config = {urls};
  }

  async create({
    url = this.config.urls.tokens, account, email, type, serviceId,
    password, authenticationMethod = type, requiredAuthenticationMethods,
    typeOptions
  }) {
    assertString(url, 'url');
    assertOptionalString(account, 'account');
    assertOptionalString(email, 'email');
    assertOptionalString(serviceId, 'serviceId');
    assertOptionalObject(typeOptions, 'typeOptions');
    assertString(authenticationMethod, 'authenticationMethod');

    if(requiredAuthenticationMethods) {
      assertArray(
        requiredAuthenticationMethods, 'requiredAuthenticationMethods');
    }
    validateTokenType(type);
    if(!(account || email)) {
      throw new Error('Either "account" or "email" must be given.');
    }

    if(email) {
      // force email to lowercase
      email = email.toLowerCase();
    }

    const payload = {};
    if(account) {
      payload.account = account;
    } else {
      payload.email = email;
    }

    if(serviceId !== undefined) {
      payload.serviceId = serviceId;
    }

    if(type === 'password') {
      assertString(password, 'password');
      payload.hash = await _hashChallenge({challenge: password});
    }

    if(typeOptions) {
      payload.typeOptions = typeOptions;
    }

    payload.authenticationMethod = authenticationMethod;
    payload.requiredAuthenticationMethods = requiredAuthenticationMethods;

    const response = await httpClient.post(url + `/${type}`, {json: payload});
    if(response.status === 204) {
      return {result: true};
    }
    return {result: response.data};
  }

  async getHashParameters({url = this.config.urls.tokens, email, type}) {
    assertString(url, 'url');
    assertString(email, 'email');
    validateTokenType(type);

    // force email to lowercase
    email = email.toLowerCase();

    const response = await httpClient.get(url + `/${type}/hash-parameters`, {
      searchParams: {email}
    });
    return response.data;
  }

  async remove({url = this.config.urls.tokens, account, type}) {
    assertString(url, 'url');
    assertString(account, 'account');
    validateTokenType(type);

    const response = await httpClient.delete(url + `/${type}`, {
      searchParams: {account}
    });
    return response.data;
  }

  async authenticate({
    url = this.config.urls.authenticate, email, type, challenge, hashChallenge
  }) {
    assertString(url, 'url');
    assertString(email, 'email');
    assertString(type, 'type');
    assertString(challenge, 'challenge');

    // force email to lowercase
    email = email.toLowerCase();

    // hash challenge for these token types and challenge values
    let hash;
    if(type === 'password' ||
      (type === 'nonce' && !challenge.startsWith('z') &&
      challenge.length < 23)) {
      hash = await this.hashChallenge({email, type, challenge});
      challenge = undefined;
    }

    // POST for verification and to establish session
    const response = await httpClient.post(url, {
      json: {
        email,
        type,
        hash,
        challenge
      },
      headers: DEFAULT_HEADERS
    });
    return {result: response.data, challengeHash: hash};
  }

  async login({url = this.config.urls.login} = {}) {
    const response = await httpClient.post(url, {
      json: {type: 'multifactor'},
      headers: DEFAULT_HEADERS
    });
    return {result: response.data};
  }

  async hashChallenge({email, type, challenge}) {
    // get user's hash parameters for hash computation
    const {hashParameters} = await this.getHashParameters({email, type});
    return _hashChallenge({challenge, hashParameters});
  }

  async setAuthenticationRequirements({
    url = this.config.urls.requirements, account, requiredAuthenticationMethods
  } = {}) {
    assertString(url, 'url');
    assertString(account, 'account');
    assertArray(requiredAuthenticationMethods, 'requiredAuthenticationMethods');

    await httpClient.post(url, {
      json: {account, requiredAuthenticationMethods},
      headers: DEFAULT_HEADERS
    });
  }

  async getAuthenticationRequirements({
    url = this.config.urls.requirements, account
  } = {}) {
    assertString(url, 'url');
    assertString(account, 'account');

    const response = await httpClient.get(url, {
      searchParams: {account},
      headers: DEFAULT_HEADERS
    });
    return response.data;
  }

  async setRecoveryEmail({
    url = this.config.urls.recovery, account, recoveryEmail
  } = {}) {
    assertString(url, 'url');
    assertString(account, 'account');
    assertString(recoveryEmail, 'recoveryEmail');

    await httpClient.post(url, {
      json: {account, recoveryEmail},
      headers: DEFAULT_HEADERS
    });
    return;
  }

  async isClientRegistered({
    url = this.config.urls.registration, email
  } = {}) {
    assertString(url, 'url');
    assertString(email, 'email');

    const response = await httpClient.get(url, {
      searchParams: {email}
    });
    return response.data;
  }
}

function validateTokenType(type) {
  assertString(type, 'type');
  if(!TOKEN_TYPES.includes(type)) {
    throw new Error('Token "type" must be one of: ' + TOKEN_TYPES.join(', '));
  }
}

function assertString(x, name) {
  if(typeof x !== 'string') {
    throw new TypeError(`"${name}" must be a string.`);
  }
}

function assertOptionalString(x, name) {
  x === undefined || assertString(x, name);
}

function assertObject(x, name) {
  if(typeof x !== 'object') {
    throw new TypeError(`"${name}" must be an object.`);
  }
}

function assertOptionalObject(x, name) {
  x === undefined || assertObject(x, name);
}

function assertArray(x, name) {
  if(!Array.isArray(x)) {
    throw new TypeError(`"${name}" must be an array.`);
  }
}

async function _hashChallenge({
  challenge,
  hashParameters = {id: 'pbkdf2-sha512', params: {i: 100000}}
}) {
  // legacy bcrypt support; to be removed in a future version
  if(hashParameters.id === 'bcrypt') {
    return bcrypt.hash(challenge, hashParameters.salt);
  }

  if(hashParameters.id !== 'pbkdf2-sha512') {
    throw new Error(`Unsupported hashing scheme "${hashParameters.id}".`);
  }

  const {params, salt} = hashParameters;
  const {hash} = await pbkdf2({secret: challenge, iterations: params.i, salt});
  return hash;
}
