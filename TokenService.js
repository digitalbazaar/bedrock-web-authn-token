/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import axios from 'axios';
import bcrypt from 'bcryptjs';

const TOKEN_TYPES = ['nonce', 'password'];

export class TokenService {
  constructor({
    urls = {
      tokens: '/authn/tokens',
      login: '/authn/token/login'
    }
  } = {}) {
    this.config = {urls};
  }

  async create(
    {url = this.config.urls.tokens, account, email, type, password}) {
    assertOptionalString(account, 'account');
    assertOptionalString(email, 'email');
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

    if(type === 'password') {
      assertString(password, 'password');
      payload.hash = await hashToken({token: password});
    }

    const response = await axios.post(url + `/${type}`, payload);
    return response.data;
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

  // TODO: change `tokenType` to `type`?
  async login({url = this.config.urls.login, email, tokenType, token}) {
    assertString(email, 'email');
    assertString(tokenType, 'tokenType');
    assertString(token, 'token');

    // get user's salt for bcrypt hash computation
    const salt = await this.getSalt({email, type: tokenType});

    // POST for verification and to establish session
    const response = await axios.post(url, {
      email,
      type: tokenType,
      // phoneNumber,
      hash: await hashToken({token, salt})
    }, {
      headers: {'Accept': 'application/ld+json, application/json'}
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

async function hashToken({token, salt = null}) {
  // TODO: receive required number of rounds from backend config
  const rounds = 10;
  if(salt === null) {
    salt = await bcrypt.genSalt(rounds);
  }
  return bcrypt.hash(token, salt);
}
