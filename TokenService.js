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

      // TODO: receive required number of rounds from backend config
      const rounds = 10;
      const salt = await bcrypt.genSalt(rounds);
      payload.hash = await bcrypt.hash(password, salt);
    }

    console.log('creating token', payload);
    const response = await axios.post(url + `/${type}`, payload);
    console.log('response', response);
    return response.data;
  }

  async getSalt({url = this.config.urls.tokens, email, type}) {
    assertString(email, 'email');
    validateTokenType(type);

    const response = await axios.get(url + `/${type}`, {
      params: {email}
    });
    console.log('response', response);
    return response.data;
  }

  async remove({url = this.config.urls.tokens, account, type}) {
    assertString(account, 'account');
    validateTokenType(type);

    const response = await axios.delete(url + `/${type}`, null, {
      params: {account}
    });
    console.log('response', response);
    return response.data;
  }

  async login({url = this.config.urls.login, email, password, token}) {
    assertString(email, 'email');
    assertOptionalString(password, 'password');
    assertOptionalString(token, 'token');
    if(!(password || token)) {
      throw new Error('Either "password" or "token" must be given.');
    }
    if(password && token) {
      throw new Error('Only "password" or "token" must be given.');
    }

    // POST for verification and to establish session
    const response = await axios.post(url, {
      email,
      // phoneNumber,
      password
    });
    console.log('response', response);
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

function assertOptionalString(x, name) {
  if(x && typeof x !== 'string') {
    return new TypeError(`"${name}" must be a string.`);
  }
}
