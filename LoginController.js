/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
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

  async login({tokenType}) {
    this.state.loading = true;

    try {
      const result = await this.tokenService.login({
        email: this.state.email,
        // phoneNumber: this.state.phoneNumber,
        tokenType: tokenType,
        token: this.state.token
      });
      return result;
    } finally {
      this.state.loading = false;
    }
  }
}
