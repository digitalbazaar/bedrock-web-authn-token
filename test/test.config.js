/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';
import path from 'node:path';
import '@bedrock/https-agent';
import '@bedrock/karma';
import '@bedrock/mongodb';
import '@bedrock/account-http';
import '@bedrock/express';

config.karma.suites['bedrock-web-authn-token'] = path.join(
  'web', '**', '*.js');
config.karma.config.proxies = {
  '/': {
    target: 'https://localhost:18443/',
    changeOrigin: true
  }
};
config.karma.config.proxyValidateSSL = false;

// mongodb config
config.mongodb.name = 'bedrock_web_authn_token_test';
config.mongodb.host = 'localhost';
config.mongodb.port = 27017;
// drop all collections on initialization
config.mongodb.dropCollections = {};
config.mongodb.dropCollections.onInit = true;
config.mongodb.dropCollections.collections = [];

// allow self-signed certs in test framework
config['https-agent'].rejectUnauthorized = false;

// setting this automatically creates login sessions for the tests when new
// accounts are created
config['account-http'].autoLoginNewAccounts = true;

config.express.session.secret = 'NOTASECRET';
config.express.session.key = 'web-authn-token-test-session';
config.express.session.prefix = 'web-authn-token-test';

config.express.useSession = true;
