# bedrock-web-authn-token ChangeLog

## 4.0.0 - 2022-05-xx

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
