/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {TokenService} from 'bedrock-web-authn-token';
import {AccountService} from 'bedrock-web-account';
import {MemoryEngine} from 'bedrock-web-store';
import {createSession} from 'bedrock-web-session';
import {authenticator} from 'otplib';

const tokenService = new TokenService();
const accountService = new AccountService();
const store = new MemoryEngine();
const short_name = 'login-test';

describe('login API', function() {
  let session = null;
  before(async function() {
    session = await createSession({id: 'session-login-test-id', store});
  });
  afterEach(async function() {
    // logout after each test
    await session.end();
  });

  it.skip('should login with a totp & password', async function() {
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
    console.log('totp result', results.totp.result);
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
  });
});
