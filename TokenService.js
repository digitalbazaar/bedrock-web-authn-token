/*!
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import axios from 'axios';
import bcrypt from 'bcryptjs';

const TOKEN_TYPES = ['nonce', 'password'];

export class TokenService {
  constructor({
    urls = {
      tokens: '/authn/tokens',
      authenticate: '/authn/token/authenticate',
      login: '/authn/token/login',
      requirements: '/authn/token/requirements',
      registration: '/authn/token/client/registration'
    }
  } = {}) {
    this.config = {urls};
  }

  async create({
    url = this.config.urls.tokens, account, email, type, clientId, password,
    authenticationMethod = type, requiredAuthenticationMethods = []
  }) {
    assertString(url, 'url');
    assertOptionalString(account, 'account');
    assertOptionalString(email, 'email');
    assertOptionalString(clientId, 'clientId');
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

    if(type === 'password') {
      assertString(password, 'password');
      payload.hash = await hashChallenge({challenge: password});
    }

    payload.authenticationMethod = authenticationMethod;
    payload.requiredAuthenticationMethods = requiredAuthenticationMethods;

    await axios.post(url + `/${type}`, payload);
    return payload;
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

    const response = await axios.delete(url + `/${type}`, null, {
      params: {account}
    });
    return response.data;
  }

  async authenticate({
    url = this.config.urls.authenticate, email, type, challenge, clientId
  }) {
    assertString(url, 'url');
    assertString(email, 'email');
    assertString(type, 'type');
    assertString(challenge, 'challenge');
    assertOptionalString(clientId, 'clientId');

    // hash challenge for these token types
    let hash;
    if(type === 'nonce' || type === 'password') {
      hash = await this.hashChallenge({email, type, challenge, clientId});
      challenge = undefined;
    }

    // POST for verification and to establish session
    const response = await axios.post(url, {
      email,
      type,
      hash,
      challenge
    }, {
      headers: {'Accept': 'application/ld+json, application/json'}
    });
    return {result: response.data, tokenHash: hash};
  }

  async login({url = this.config.urls.login} = {}) {
    const response = await axios.post(url, {type: 'multifactor'}, {
      headers: {'Accept': 'application/ld+json, application/json'}
    });
    return {result: response.data};
  }

  async hashChallenge({email, type, challenge, clientId}) {
    // get user's salt for bcrypt hash computation
    const salt = await this.getSalt({email, type});
    return hashChallenge({challenge, clientId, salt});
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
      headers: {'Accept': 'application/ld+json, application/json'}
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

function assertArray(x, name) {
  if(!Array.isArray(x)) {
    throw new TypeError(`"${name}" must be an array.`);
  }
}

async function hashChallenge({challenge, clientId, salt = null}) {
  // TODO: receive required number of rounds from backend config
  const rounds = 10;
  if(salt === null) {
    salt = await bcrypt.genSalt(rounds);
  }
  if(clientId !== undefined) {
    challenge += `:${clientId}`;
  }
  return bcrypt.hash(challenge, salt);
}
