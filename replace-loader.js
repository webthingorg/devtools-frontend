const regex = /\(function\(mod\) ?\{\n?.*\}\)\(function\(CodeMirror\) ?\{/s;
const replacement = '(function(mod) { mod(CodeMirror); })(function(CodeMirror) {';

module.exports = function replace_loader(src) {
    return src.replace(regex, replacement)
}