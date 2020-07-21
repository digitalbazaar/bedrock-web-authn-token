/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {TokenService} from 'bedrock-web-authn-token';
import {AccountService} from 'bedrock-web-account';

const tokenService = new TokenService();
const accountService = new AccountService();
const short_name = 'auth-test';

// import mockData from './mock-data.js';

describe('token API', () => {
  describe('create API', () => {
    describe('unauthenticated request', () => {
      it('should not create a token with out "authenticationMethod"',
        async () => {
          let result, err = null;
          try {
            result = await tokenService.create({authenticationMethod: null});
          } catch(e) {
            err = e;
          }
          should.not.exist(result);
          should.exist(err);
          err.should.have.property('name');
          err.name.should.be.a('string');
          err.name.should.equal('TypeError');
          err.should.have.property('message');
          err.message.should.be.a('string');
          err.message.should.contain(
            '"authenticationMethod" must be a string.');
        });
      it('should create a totp', async () => {
        const email = 'totp-test@example.com';
        let result, err, account = null;
        try {
          account = await accountService.create({email});
console.log('created account calling on tokenService.create');
          result = await tokenService.create({
            account: account.id,
            type: 'totp',
            authenticationMethod: 'totp-challenge',
            serviceId: short_name
          });
        } catch(e) {
console.error(e);
          err = e;
        }
        should.exist(result);
        should.not.exist(err);
        err.should.have.property('name');
        err.name.should.be.a('string');
        err.name.should.equal('Error');
        err.should.have.property('message');
        err.message.should.be.a('string');
      });
    }); // end authenticated request
  }); // end create
});
