# bedrock-web-authn-token ChangeLog

## 7.0.1 - 2025-mm-dd

### Fixed
- Fix bug with pbkdf2 expression of salt parameter.

## 7.0.0 - 2023-10-16

### Changed
- **BREAKING**: Drop support for Node.js < 18.
- Use `@digitalbazaar/http-client@4.0`. Requires Node.js 18+.

## 6.0.1 - 2022-08-22

### Fixed
- Properly export `crypto` internally in node 14.

## 6.0.0 - 2022-08-19

### Changed
- **BREAKING**: Use `exports` instead of `module`.
- Update dependencies.
- Lint module.

### Fixed
- Improve browser and Node.js WebCrypto support. Note that, as of 5.0.0, older
  browsers and Node.js 14 users need to install an appropriate polyfill.

## 5.0.0 - 2022-05-22

### Removed
- Drop bcrypt support.

## 4.0.2 - 2022-05-22

### Fixed
- Use `replace` instead of `replaceAll` for node 14.x support.
- Use `@digitalbazaar/totp` in test suite.

## 4.0.1 - 2022-05-21

### Fixed
- Fix authentication of long, machine-entry style challenges.

## 4.0.0 - 2022-05-21

### Changed
- **BREAKING**: Use `/hash-parameters` route instead of `/salt` route to
  get parameters to hash passwords and nonces.
- **BREAKING**: Default to using pbkdf2 instead of bcrypt for password
  and nonce hashing because there is native support for it on all supported
  platforms.
- **BREAKING**: Return `{result: true}` from `TokenService.create` when
  the response from the server is 204 no content.
- **BREAKING**: Force all emails to lower case before submission to a backend
  service.
- **BREAKING**: Must run against a bedrock server using:
  - `@bedrock/authn-token@10`
  - `@bedrock/authn-token-http@7`.

## 3.0.0 - 2022-04-10

### Changed
- **BREAKING**: Rename package to `@bedrock/web-authn-token`.
- **BREAKING**: Convert to module (ESM).

## 2.5.0 - 2021-05-07

### Changed
- Replace `axios` with `@digitalbazaar/http-client`.

### Removed
- Remove optional `clientId` from all apis.

## 2.4.0 - 2021-04-21

### Changed
- Create api now takes an optional `typeOptions` param.

## 2.3.0 - 2021-03-24

### Changed
- Use `bedrock-web-account@2.0.0`.

## 2.2.0 - 2020-07-01

### Changed
- Update deps.
- Update test deps.
- Update CI workflow.

## 2.1.0 - 2020-04-21

### Added
- Setup CI and coverage workflow.

### Changed
- Update deps.

## 2.0.0 - 2020-03-05

### Added
- Add `authenticate` API.
- Allow setting `requiredAuthenticationMethods` and `authenticationMethod`
  on tokens.

### Changed
- **BREAKING**: Remove params from `login` API; require use of `authenticate`
  API prior to `login`.

## 1.1.0 - 2020-01-06

### Added
- Add option to include `clientId` for `nonce` and `challenge` tokens.

## 1.0.0 - 2019-04-16

### Added
- Add core files.

- See git history for changes previous to this release.
