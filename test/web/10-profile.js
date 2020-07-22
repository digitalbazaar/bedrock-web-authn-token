/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {TokenService} from 'bedrock-web-authn-token';
import {AccountService} from 'bedrock-web-account';
import {MemoryEngine} from 'bedrock-web-store';
import {createSession} from 'bedrock-web-session';

const tokenService = new TokenService();
const accountService = new AccountService();
const store = new MemoryEngine();
const short_name = 'auth-test';

// import mockData from './mock-data.js';

describe('token API', function() {
  describe('create API', function() {
    describe('authenticated request', function() {
      let session = null;
      before(async function() {
        session = await createSession({id: 'session-test-id', store});
      });
      beforeEach(async function() {
        await session.end();
      });
      // there are 4 types: password, nonce, challenge, & totp
      // @see https://github.com/digitalbazaar/bedrock-authn-token/blob/
      // 7a2d3d5f832c5ce4d665b6d80862c5cd7780c9c9/lib/helpers.js#L18-L28
      // totp creates a time-based one-time password
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
      it('should create a password', async () => {
        const email = 'password-test@example.com';
        let result, err, account = null;
        try {
          account = await accountService.create({email});
          result = await tokenService.create({
            account: account.id,
            type: 'password',
            password: 'test-password',
            authenticationMethod: 'password',
            serviceId: short_name
          });
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        // FIXME ensure password should return an empty result
        should.exist(result);
        result.should.be.an('object');
        result.should.have.property('result');
      });
      it('should create a nonce', async () => {
        const email = 'nonce-test@example.com';
        let result, err, account = null;
        try {
          account = await accountService.create({email});
          result = await tokenService.create({
            account: account.id,
            type: 'nonce',
            authenticationMethod: 'email-nonce-challenge'
          });
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        // note: this might not return any data
        // FIXME: make sure that the nonce returns an empty result
        should.exist(result);
        result.should.be.an('object');
        result.should.have.property('result');
      });
      // FIXME challenges have not been implemented yet:
      // @see https://github.com/digitalbazaar/bedrock-authn-token/blob/
      // 7a2d3d5f832c5ce4d665b6d80862c5cd7780c9c9/lib/index.js#L143-L145
      it.skip('should create a challenge', async () => {
        const email = 'challenge-test@example.com';
        let result, err, account = null;
        try {
          account = await accountService.create({email});
          ({result} = await tokenService.create({
            account: account.id,
            type: 'challenge',
            challenge: 'test-the-challenge',
            authenticationMethod: 'test-challenge',
            serviceId: short_name
          }));
        } catch(e) {
          err = e;
        }
        should.not.exist(err);
        // note: this might not return any data
        should.exist(result);
        result.should.be.an('object');
        result.should.have.property('type');
        result.type.should.be.a('string');
        result.type.should.contain('challenge');
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
