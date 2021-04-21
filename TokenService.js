/*!
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */

import axios from 'axios';
import bcrypt from 'bcryptjs';

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
    url = this.config.urls.tokens, account, email, type, clientId, serviceId,
    password, authenticationMethod = type, requiredAuthenticationMethods,
    typeOptions
  }) {
    assertString(url, 'url');
    assertOptionalString(account, 'account');
    assertOptionalString(email, 'email');
    assertOptionalString(clientId, 'clientId');
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

    const payload = {};
    if(account) {
      payload.account = account;
    } else {
      payload.email = email;
    }

    if(clientId !== undefined) {
      payload.clientId = clientId;
    }

    // FIXME: default to hostname?
    if(serviceId !== undefined) {
      payload.serviceId = serviceId;
    }

    if(type === 'password') {
      assertString(password, 'password');
      payload.hash = await hashChallenge({challenge: password});
    }

    if(typeOptions) {
      payload.typeOptions = typeOptions;
    }

    payload.authenticationMethod = authenticationMethod;
    payload.requiredAuthenticationMethods = requiredAuthenticationMethods;

    const response = await axios.post(url + `/${type}`, payload);
    return {result: response.data};
  }

  async getSalt({url = this.config.urls.tokens, email, type}) {
    assertString(url, 'url');
    assertString(email, 'email');
    validateTokenType(type);

    const response = await axios.get(url + `/${type}/salt`, {
      params: {email}
    });
    const {salt} = response.data;
    return salt;
  }

  async remove({url = this.config.urls.tokens, account, type}) {
    assertString(url, 'url');
    assertString(account, 'account');
    validateTokenType(type);

    const response = await axios.delete(url + `/${type}`, {
      params: {account}
    });
    return response.data;
  }

  async authenticate({
    url = this.config.urls.authenticate, email, type, challenge
  }) {
    assertString(url, 'url');
    // FIXME account or email?
    assertString(email, 'email');
    assertString(type, 'type');
    assertString(challenge, 'challenge');

    // hash challenge for these token types
    let hash;
    if(type === 'nonce' || type === 'password') {
      hash = await this.hashChallenge({email, type, challenge});
      challenge = undefined;
    }

    // POST for verification and to establish session
    try {
      const response = await axios.post(url, {
        email,
        type,
        hash,
        challenge
      }, {
        headers: DEFAULT_HEADERS
      });
      return {result: response.data, challengeHash: hash};
    } catch(e) {
      _rethrowAxiosError(e);
    }
  }

  async login({url = this.config.urls.login} = {}) {
    const response = await axios.post(url, {type: 'multifactor'}, {
      headers: DEFAULT_HEADERS
    });
    return {result: response.data};
  }

  async hashChallenge({email, type, challenge}) {
    // get user's salt for bcrypt hash computation
    const salt = await this.getSalt({email, type});
    return hashChallenge({challenge, salt});
  }

  async setAuthenticationRequirements({
    url = this.config.urls.requirements, account, requiredAuthenticationMethods
  } = {}) {
    assertString(url, 'url');
    assertString(account, 'account');
    assertArray(requiredAuthenticationMethods, 'requiredAuthenticationMethods');

    await axios.post(url, {
      account, requiredAuthenticationMethods
    }, {
      headers: DEFAULT_HEADERS
    });
  }

  async getAuthenticationRequirements({
    url = this.config.urls.requirements, account
  } = {}) {
    assertString(url, 'url');
    assertString(account, 'account');

    const response = await axios.get(url, {
      params: {account}
    }, {
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

    await axios.post(url, {
      account, recoveryEmail
    }, {
      headers: DEFAULT_HEADERS
    });
    return;
  }

  async isClientRegistered({
    url = this.config.urls.registration, email
  } = {}) {
    assertString(url, 'url');
    assertString(email, 'email');

    const response = await axios.get(url, {
      params: {email}
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

async function hashChallenge({challenge, salt = null}) {
  console.log({challenge, salt})
  // TODO: receive required number of rounds from backend config
  const rounds = 10;
  if(salt === null) {
    salt = await bcrypt.genSalt(rounds);
  }
  return bcrypt.hash(challenge, salt);
}

function _rethrowAxiosError(error) {
  if(error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // FIXME: there may be better wrappers already created
    if(error.response.data.message && error.response.data.type) {
      const err = new Error(`${error.response.data.message}`);
      err.name = err.type = error.response.data.type;
      throw err;
    }
  }
  throw new Error(error.message);
}
