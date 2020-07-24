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
const short_name = 'login-test';

describe('login API', function() {
  let session = null;
  beforeEach(async function() {
    session = await getSession({id: 'session-test-login-id', store});
    // ensure we logout tests from other suites
    await session.end();
  });
  afterEach(async function() {
    // logout after each test
    await session.end();
  });

  it('should login with a totp & password', async function() {
    const email = 'password-totp-login-test@example.com';
    const password = 'Test0123456789!!!';
    const results = {
      password: null,
      totp: null
    };
    let err, account = null;
    try {
      account = await accountService.create({email});
      await tokenService.setAuthenticationRequirements({
        account: account.id,
        requiredAuthenticationMethods: [
          'totp-test-challenge',
          'password-test'
        ]
      });
      results.totp = await tokenService.create({
        account: account.id,
        type: 'totp',
        authenticationMethod: 'totp-test-challenge',
        serviceId: short_name
      });

      results.password = await tokenService.create({
        account: account.id,
        type: 'password',
        password,
        authenticationMethod: 'password-test',
        serviceId: short_name
      });
    } catch(e) {
      err = e;
    }
    should.not.exist(err);
    should.exist(results.password);
    results.password.should.be.an('object');
    should.exist(results.totp);
    results.totp.should.be.an('object');
    err = null;
    const authResults = {
      password: null,
      totp: null
    };
    const challenge = authenticator.generate(results.totp.result.secret);
    try {
      authResults.totp = await tokenService.authenticate(
        {type: 'totp', email, challenge});
      authResults.password = await tokenService.authenticate(
        {email, type: 'password', challenge: password});
    } catch(e) {
      err = e;
    }
    should.not.exist(err);
    authResults.totp.should.be.an('object');
    authResults.totp.result.should.have.property('authenticated');
    authResults.totp.result.authenticated.should.be.a('boolean');
    authResults.totp.result.authenticated.should.equal(true);
    authResults.password.should.be.an('object');
    authResults.password.result.should.have.property('authenticated');
    authResults.password.result.authenticated.should.be.a('boolean');
    authResults.password.result.authenticated.should.equal(true);
    let result = null;
    err = null;
    try {
      ({result} = await tokenService.login());
    } catch(e) {
      err = e;
    }
    should.not.exist(err);
    should.exist(result);
    result.should.be.an('object');
    result.should.have.property('account');
    result.account.should.be.a('string');
    result.account.should.equal(account.id);
  });
});
