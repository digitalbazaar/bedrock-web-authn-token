/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
const bedrock = require('bedrock');
require('bedrock-mongodb');
require('bedrock-express');
require('bedrock-session-http');
require('bedrock-session-mongodb');
require('bedrock-authn-token');
require('bedrock-authn-token-http');
require('bedrock-account');
require('bedrock-account-http');
require('bedrock-https-agent');
require('bedrock-security-context');
require('bedrock-test');
require('bedrock-karma');

bedrock.start();
