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

  async create({url = this.config.urls.tokens, email, type, password}) {
    assertString(email, 'email');
    validateTokenType(type);

    const payload = {email};

    if(type === 'password') {
      assertString(password, 'password');
      payload.hash = await hashToken(password);
    }

    const response = await axios.post(url + `/${type}`, payload);
    return response.data;
  }

  async getSalt({url = this.config.urls.tokens, email, type}) {
    assertString(email, 'email');
    validateTokenType(type);

    const response = await axios.get(url + `/${type}`, {
      params: {email}
    });
    return response.data;
  }

  async remove({url = this.config.urls.tokens, account, type}) {
    assertString(account, 'account');
    validateTokenType(type);

    const response = await axios.delete(url + `/${type}`, null, {
      params: {account}
    });
    return response.data;
  }

  async login({url = this.config.urls.login, email, token}) {
    assertString(email, 'email');
    assertString(token, 'token');

    // POST for verification and to establish session
    const response = await axios.post(url, {
      email,
      // phoneNumber,
      hash: await hashToken(token)
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
    return new TypeError(`"${name}" must be a string.`);
  }
}

async function hashToken(token) {
  // TODO: receive required number of rounds from backend config
  const rounds = 10;
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(token, salt);
}
