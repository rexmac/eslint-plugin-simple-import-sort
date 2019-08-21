// import coreModules from 'resolve/lib/core';
// import resolve from 'eslint-module-utils/resolve';
const coreModules = require('resolve/lib/core');
const resolve = require('eslint-module-utils/resolve').default;
const join = require('path').join;

function isAbsoluteImport(name) {
  return name.indexOf('/') === 0;
}

function isBuiltIn(name, settings, path) {
  if (path) return false;
  const base = baseModule(name);
  const extras = (settings && settings['import/core-modules']) || [];
  return coreModules[base] || extras.indexOf(base) > -1;
}

function isExternalPath(path, name, settings) {
  const folders = (settings && settings['import/external-module-folders']) || ['node_modules']

  // extract the part before the first / (redux-saga/effects => redux-saga)
  const packageName = name.match(/([^/]+)/)[0]

  return !path || folders.some(folder => -1 < path.indexOf(join(folder, packageName)))
}

const externalModuleRegExp = /^\w/
function isExternalModule(name, settings, path) {
  return externalModuleRegExp.test(name) && isExternalPath(path, name, settings)
}

const externalModuleMainRegExp = /^[\w]((?!\/).)*$/
function isExternalModuleMain(name, settings, path) {
  return externalModuleMainRegExp.test(name) && isExternalPath(path, name, settings)
}

const scopedRegExp = /^@[^/]+\/[^/]+/
function isScoped(name) {
  return scopedRegExp.test(name)
}

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/
function isScopedMain(name) {
  return scopedMainRegExp.test(name)
}

function isInternalModule(name, settings, path) {
  const matchesScopedOrExternalRegExp = scopedRegExp.test(name) || externalModuleRegExp.test(name)
  return (matchesScopedOrExternalRegExp && !isExternalPath(path, name, settings))
}

function isRelativeToParent(name) {
  return /^\.\.[\\/]/.test(name)
}

const indexFiles = ['.', './', './index', './index.js']
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1
}

function isRelativeToSibling(name) {
  return /^\.[\\/]/.test(name)
}

function importType(name, context) {
  const settings = undefined;
  const path = resolve(name, context);
  if (isAbsoluteImport(name)) { return 'absolute' }
  if (isBuiltIn(name, settings, path)) { return 'builtin' }
  if (isInternalModule(name, settings, path)) { return 'internal' }
  if (isExternalModule(name, settings, path)) { return 'external' }
  if (isScoped(name, settings, path)) { return 'external' }
  if (isRelativeToParent(name, settings, path)) { return 'parent' }
  if (isIndex(name, settings, path)) { return 'index' }
  if (isRelativeToSibling(name, settings, path)) { return 'sibling' }
  return 'unknown'
}

/*
  node_modules/eslint-plugin-simple-import-sort/src/sort.js:getGroupAndSource:L866

  const name = importNode.source.value;
  const it = importType(name);
  console.log('getGroupAndSource', {it, name});
*/

module.exports = importType;
