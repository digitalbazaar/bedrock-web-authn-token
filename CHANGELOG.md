# bedrock-web-authn-token ChangeLog

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
