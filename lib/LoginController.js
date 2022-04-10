/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {TokenService} from './TokenService.js';

export class LoginController {
  constructor({tokenServiceConfig = {}} = {}) {
    this.state = {
      loading: false,
      email: null,
      challenge: null
    };
    this.tokenService = new TokenService(tokenServiceConfig);
  }

  async authenticate({type, clientId}) {
    this.state.loading = true;

    try {
      const {email} = this.state;
      let {challenge} = this.state;
      if(type !== 'password') {
        // strip any whitespace from challenge
        challenge = challenge.replace(/\s/g, '');
      }

      const result = await this.tokenService.authenticate({
        email,
        type,
        challenge,
        clientId
      });
      return result;
    } finally {
      this.state.loading = false;
    }
  }

  async login() {
    this.state.loading = true;

    try {
      const result = await this.tokenService.login();
      return result;
    } finally {
      this.state.loading = false;
    }
  }
}
