/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
const bedrock = require('bedrock');
require('bedrock-mongodb');
require('bedrock-authn-token');
require('bedrock-authn-token-http');
require('bedrock-account');
require('bedrock-account-http');
require('bedrock-https-agent');
require('bedrock-security-context');

const brPassport = require('bedrock-passport');
const mockData = require('./web/mock-data');
brPassport.optionallyAuthenticated = (req, res, next) => {
  req.user = {
    account: {},
    actor: mockData.actors.alpha
  };
  next();
};

require('bedrock-test');
require('bedrock-karma');

bedrock.start();
