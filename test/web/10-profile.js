/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

import {TokenService} from 'bedrock-web-authn-token';

const tokenService = new TokenService();
// import mockData from './mock-data.js';

describe('token API', () => {
  describe('create API', () => {
    describe('authenticated request', () => {
      it('does something incorrectly', async () => {
        let result;
        let err;
        try {
          result = await tokenService.create();
        } catch(e) {
          err = e;
        }
        should.not.exist(result);
        should.exist(err);
      });
    }); // end authenticated request
  }); // end create
});
