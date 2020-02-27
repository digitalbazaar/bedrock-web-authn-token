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
      login: '/authn/token/login'
    }
  } = {}) {
    this.config = {urls};
  }

  async create({
    url = this.config.urls.tokens, account, email, type, clientId, password,
    authenticationMethod = type, requiredAuthenticationMethods = []
  }) {
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
    assertString(email, 'email');
    validateTokenType(type);

    const response = await axios.get(url + `/${type}/salt`, {
      params: {email}
    });
    const {salt} = response.data;
    return salt;
  }

  async remove({url = this.config.urls.tokens, account, type}) {
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

  async login({url = this.config.urls.login}) {
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
