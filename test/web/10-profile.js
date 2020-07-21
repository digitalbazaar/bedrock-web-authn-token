/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {TokenService} from 'bedrock-web-authn-token';
import {AccountService} from 'bedrock-web-account';

const tokenService = new TokenService();
const accountService = new AccountService();
const short_name = 'auth-test';

// import mockData from './mock-data.js';

describe('token API', function() {
  describe('create API', function() {
    describe('authenticated request', function() {
      it('should create a totp', async () => {
        const email = 'totp-test@example.com';
        let result, err, account = null;
        try {
          account = await accountService.create({email});
          ({result} = await tokenService.create({
            account: account.id,
            type: 'totp',
            authenticationMethod: 'totp-challenge',
            serviceId: short_name
          }));
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        should.exist(result);
        result.should.be.an('object');
        result.should.have.property('type');
        result.type.should.be.a('string');
        result.type.should.contain('totp');
      });
    }); // end authenticated request
    describe('unauthenticated request', function() {
      it('should not create a token with out "authenticationMethod"',
        async function() {
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
    }); // end unauthenticated request
  }); // end create
});
