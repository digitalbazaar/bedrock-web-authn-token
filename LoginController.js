/*!
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {TokenService} from './TokenService.js';

export class LoginController {
  constructor({tokenServiceConfig = {}} = {}) {
    this.state = {
      loading: false,
      email: null,
      token: null
    };
    this.tokenService = new TokenService(tokenServiceConfig);
  }

  async login({tokenType, clientId}) {
    this.state.loading = true;

    try {
      let token = this.state.token;
      if(tokenType === 'nonce') {
        // strip any whitespace from nonce
        token = token.replace(/\s/g, '');
      }

      const result = await this.tokenService.login({
        email: this.state.email,
        // phoneNumber: this.state.phoneNumber,
        tokenType,
        token,
        clientId
      });
      return result;
    } finally {
      this.state.loading = false;
    }
  }
}
