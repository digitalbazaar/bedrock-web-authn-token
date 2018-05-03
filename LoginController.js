/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {TokenService} from './TokenService.js';

export class LoginController {
  constructor(config = {}) {
    this.state = {
      loading: false,
      multiple: false,
      password: null,
      email: null,
      passcode: null
    };
    this.tokenService = new TokenService(config);
  }

  async login() {
    this.state.loading = true;

    try {
      const result = await this.tokenService.login({
        email: this.state.email,
        password: this.state.password
      });
      console.log('login result', result);

      // TODO:
    } finally {
      this.state.loading = false;
    }
  }
}
