/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as totp from '@digitalbazaar/totp';
import {AccountService} from '@bedrock/web-account';
import {createSession, session} from '@bedrock/web-session';
import {TokenService} from '@bedrock/web-authn-token';

const tokenService = new TokenService();
const accountService = new AccountService();
const short_name = 'auth-test';

describe('token API', function() {
  before(async function() {
    if(!session) {
      await createSession();
    }
    // ensure we logout tests from other suites
    await session.end();
  });
  afterEach(async function() {
    // logout after each test
    await session.end();
  });

  describe('create API', function() {
    describe('authenticated request', function() {
      // there are 3 types: password, nonce, and totp
      // @see https://github.com/digitalbazaar/bedrock-authn-token/blob/
      // v10.0.2/lib/helpers.js#L15
      // totp creates a time-based one-time password
      it('should create a totp', async () => {
        const email = 'totp-test@example.com';
        let result;
        let err;
        let account = null;
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
        let result;
        let err;
        let account = null;
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
        should.exist(result);
        result.should.be.an('object');
        result.should.have.property('result');
        result.result.should.equal(true);
      });
      it('should create a nonce', async () => {
        const email = 'nonce-test@example.com';
        let result;
        let err;
        let account = null;
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
        should.exist(result);
        result.should.be.an('object');
        result.should.have.property('result');
        result.result.should.equal(true);
      });
    }); // end authenticated request
    describe('unauthenticated request', function() {
      it('should not create a token without "authenticationMethod"',
        async function() {
          let result;
          let err = null;
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
    it('should authenticate with a password', async function() {
      const email = 'password-auth-test@example.com';
      const password = 'Test0123456789!!!';
      let result;
      let err;
      let account = null;
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
      should.exist(result);
      result.should.be.an('object');
      result.should.have.property('result');
      result.result.should.equal(true);
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
      let result;
      let err;
      let account = null;
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
      // this emulates totp apps like google authenticator
      const {token: challenge} = await totp.generateToken(
        {secret: result.secret});
      result = err = undefined;
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
  });
});
