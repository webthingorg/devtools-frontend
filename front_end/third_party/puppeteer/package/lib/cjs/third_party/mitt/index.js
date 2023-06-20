'use strict';

function getDefaultExportFromCjs$2 (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getDefaultExportFromCjs$1 (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function mitt(n){return {all:n=n||new Map,on:function(t,e){var i=n.get(t);i?i.push(e):n.set(t,[e]);},off:function(t,e){var i=n.get(t);i&&(e?i.splice(i.indexOf(e)>>>0,1):n.set(t,[]));},emit:function(t,e){var i=n.get(t);i&&i.slice().map(function(n){n(e);}),(i=n.get("*"))&&i.slice().map(function(n){n(t,e);});}}}

var mitt_1 = mitt;

var index = /*@__PURE__*/getDefaultExportFromCjs(mitt_1);

var mitt_2 = index;

var index$1 = /*@__PURE__*/getDefaultExportFromCjs$1(mitt_2);

var mitt_3 = index$1;

var index$2 = /*@__PURE__*/getDefaultExportFromCjs$2(mitt_3);

module.exports = index$2;
