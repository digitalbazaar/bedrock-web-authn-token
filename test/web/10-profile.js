/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {TokenService} from 'bedrock-web-authn-token';

const tokenService = new TokenService();
// import mockData from './mock-data.js';

describe('token API', () => {
  describe('create API', () => {
    describe('unauthenticated request', () => {
      it('should not create a token with out "authenticationMethod"',
        async () => {
          let result, err = null;
          try {
            result = await tokenService.create(
              {authenticationMethod: null});
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
    }); // end authenticated request
  }); // end create
});
