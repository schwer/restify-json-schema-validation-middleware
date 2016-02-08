#!/bin/bash
set -eu

npm adduser <<!
$NPM_USERNAME
$NPM_PASSWORD
$NPM_EMAIL
!
npm publish
