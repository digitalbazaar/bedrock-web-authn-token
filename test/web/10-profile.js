/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {TokenService} from 'bedrock-web-authn-token';
import {AccountService} from 'bedrock-web-account';
import {getSession} from 'bedrock-web-session';
import {authenticator} from 'otplib';
import {store} from './helpers.js';

const tokenService = new TokenService();
const accountService = new AccountService();
const short_name = 'auth-test';

describe('token API', function() {
  describe('create API', function() {
    describe('authenticated request', function() {
      let session = null;
      beforeEach(async function() {
        session = await getSession({id: 'session-test-id', store});
      });
      afterEach(async function() {
        // logout after each test
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
      // FIXME challenges have not been implemented in bedrock-authn-token yet:
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
  describe('authenticate API', function() {
    let session = null;
    beforeEach(async function() {
      session = await getSession({id: 'session-test-auth-id', store});
    });
    beforeEach(async function() {
      await session.end();
    });
    it('should authenticate with a password', async function() {
      const email = 'password-auth-test@example.com';
      const password = 'Test0123456789!!!';
      let result, err, account = null;
      try {
        account = await accountService.create({email});
        result = await tokenService.create({
          account: account.id,
          type: 'password',
          password,
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
      result, err = null;
      try {
        ({result} = await tokenService.authenticate(
          {email, type: 'password', challenge: password}));
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(result);
      result.should.be.an('object');
      result.should.have.property('account');
      result.account.should.be.an('object');
      result.account.should.have.property('email');
      result.account.email.should.contain(email);
      result.should.have.property('authenticated');
      result.authenticated.should.be.a('boolean');
      result.authenticated.should.equal(true);
      result.should.have.property('authenticatedMethods');
      result.authenticatedMethods.should.be.an('array');
      result.authenticatedMethods.should.deep.equal(['password']);
    });
    it('should authenticate with a totp', async function() {
      const email = 'totp-auth-test@example.com';
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
      result, err = null;
      // this emulates totp apps like google authenticator
      const challenge = authenticator.generate(result.secret);
      try {
        ({result} = await tokenService.authenticate(
          {type: 'totp', email, challenge}));
      } catch(e) {
        err = e;
      }
      should.not.exist(err);
      should.exist(result);
      result.should.be.an('object');
      result.should.have.property('account');
      result.account.should.be.an('object');
      result.account.should.have.property('email');
      result.account.email.should.contain(email);
      result.should.have.property('authenticated');
      result.authenticated.should.be.a('boolean');
      result.authenticated.should.equal(true);
      result.should.have.property('authenticatedMethods');
      result.authenticatedMethods.should.be.an('array');
      result.authenticatedMethods.should.deep.equal(['totp-challenge']);
    });
    // FIXME the actual nonce is sent in a bedrock-event
    // you will need to await that event to login
    it.skip('should authenticate with a nonce', async function() {
      const email = 'nonce-auth-test@example.com';
      let result, err, account = null;
      try {
        account = await accountService.create({email});
        result = await tokenService.create({
          account: account.id,
          type: 'nonce',
          authenticationMethod: 'auth-nonce-challenge'
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
      // the event should be issued
    });
  });
});
