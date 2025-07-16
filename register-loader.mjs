// register-loader.mjs
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// This tells Node to load ts-node as an ESM loader
register('ts-node/esm', pathToFileURL('./'));