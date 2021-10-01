var atoms = ["false", "nil", "true"];
var specialForms = [".", "catch", "def", "do", "if", "monitor-enter",
                    "monitor-exit", "new", "quote", "recur", "set!", "throw", "try", "var"];
var coreSymbols = ["*", "*'", "*1", "*2", "*3", "*agent*",
                   "*allow-unresolved-vars*", "*assert*", "*clojure-version*",
                   "*command-line-args*", "*compile-files*", "*compile-path*",
                   "*compiler-options*", "*data-readers*", "*default-data-reader-fn*", "*e",
                   "*err*", "*file*", "*flush-on-newline*", "*fn-loader*", "*in*",
                   "*math-context*", "*ns*", "*out*", "*print-dup*", "*print-length*",
                   "*print-level*", "*print-meta*", "*print-namespace-maps*",
                   "*print-readably*", "*read-eval*", "*reader-resolver*", "*source-path*",
                   "*suppress-read*", "*unchecked-math*", "*use-context-classloader*",
                   "*verbose-defrecords*", "*warn-on-reflection*", "+", "+'", "-", "-'",
                   "->", "->>", "->ArrayChunk", "->Eduction", "->Vec", "->VecNode",
                   "->VecSeq", "-cache-protocol-fn", "-reset-methods", "..", "/", "<", "<=",
                   "=", "==", ">", ">=", "EMPTY-NODE", "Inst", "StackTraceElement->vec",
                   "Throwable->map", "accessor", "aclone", "add-classpath", "add-watch",
                   "agent", "agent-error", "agent-errors", "aget", "alength", "alias",
                   "all-ns", "alter", "alter-meta!", "alter-var-root", "amap", "ancestors",
                   "and", "any?", "apply", "areduce", "array-map", "as->", "aset",
                   "aset-boolean", "aset-byte", "aset-char", "aset-double", "aset-float",
                   "aset-int", "aset-long", "aset-short", "assert", "assoc", "assoc!",
                   "assoc-in", "associative?", "atom", "await", "await-for", "await1",
                   "bases", "bean", "bigdec", "bigint", "biginteger", "binding", "bit-and",
                   "bit-and-not", "bit-clear", "bit-flip", "bit-not", "bit-or", "bit-set",
                   "bit-shift-left", "bit-shift-right", "bit-test", "bit-xor", "boolean",
                   "boolean-array", "boolean?", "booleans", "bound-fn", "bound-fn*",
                   "bound?", "bounded-count", "butlast", "byte", "byte-array", "bytes",
                   "bytes?", "case", "cast", "cat", "char", "char-array",
                   "char-escape-string", "char-name-string", "char?", "chars", "chunk",
                   "chunk-append", "chunk-buffer", "chunk-cons", "chunk-first", "chunk-next",
                   "chunk-rest", "chunked-seq?", "class", "class?", "clear-agent-errors",
                   "clojure-version", "coll?", "comment", "commute", "comp", "comparator",
                   "compare", "compare-and-set!", "compile", "complement", "completing",
                   "concat", "cond", "cond->", "cond->>", "condp", "conj", "conj!", "cons",
                   "constantly", "construct-proxy", "contains?", "count", "counted?",
                   "create-ns", "create-struct", "cycle", "dec", "dec'", "decimal?",
                   "declare", "dedupe", "default-data-readers", "definline", "definterface",
                   "defmacro", "defmethod", "defmulti", "defn", "defn-", "defonce",
                   "defprotocol", "defrecord", "defstruct", "deftype", "delay", "delay?",
                   "deliver", "denominator", "deref", "derive", "descendants", "destructure",
                   "disj", "disj!", "dissoc", "dissoc!", "distinct", "distinct?", "doall",
                   "dorun", "doseq", "dosync", "dotimes", "doto", "double", "double-array",
                   "double?", "doubles", "drop", "drop-last", "drop-while", "eduction",
                   "empty", "empty?", "ensure", "ensure-reduced", "enumeration-seq",
                   "error-handler", "error-mode", "eval", "even?", "every-pred", "every?",
                   "ex-data", "ex-info", "extend", "extend-protocol", "extend-type",
                   "extenders", "extends?", "false?", "ffirst", "file-seq", "filter",
                   "filterv", "find", "find-keyword", "find-ns", "find-protocol-impl",
                   "find-protocol-method", "find-var", "first", "flatten", "float",
                   "float-array", "float?", "floats", "flush", "fn", "fn?", "fnext", "fnil",
                   "for", "force", "format", "frequencies", "future", "future-call",
                   "future-cancel", "future-cancelled?", "future-done?", "future?",
                   "gen-class", "gen-interface", "gensym", "get", "get-in", "get-method",
                   "get-proxy-class", "get-thread-bindings", "get-validator", "group-by",
                   "halt-when", "hash", "hash-combine", "hash-map", "hash-ordered-coll",
                   "hash-set", "hash-unordered-coll", "ident?", "identical?", "identity",
                   "if-let", "if-not", "if-some", "ifn?", "import", "in-ns", "inc", "inc'",
                   "indexed?", "init-proxy", "inst-ms", "inst-ms*", "inst?", "instance?",
                   "int", "int-array", "int?", "integer?", "interleave", "intern",
                   "interpose", "into", "into-array", "ints", "io!", "isa?", "iterate",
                   "iterator-seq", "juxt", "keep", "keep-indexed", "key", "keys", "keyword",
                   "keyword?", "last", "lazy-cat", "lazy-seq", "let", "letfn", "line-seq",
                   "list", "list*", "list?", "load", "load-file", "load-reader",
                   "load-string", "loaded-libs", "locking", "long", "long-array", "longs",
                   "loop", "macroexpand", "macroexpand-1", "make-array", "make-hierarchy",
                   "map", "map-entry?", "map-indexed", "map?", "mapcat", "mapv", "max",
                   "max-key", "memfn", "memoize", "merge", "merge-with", "meta",
                   "method-sig", "methods", "min", "min-key", "mix-collection-hash", "mod",
                   "munge", "name", "namespace", "namespace-munge", "nat-int?", "neg-int?",
                   "neg?", "newline", "next", "nfirst", "nil?", "nnext", "not", "not-any?",
                   "not-empty", "not-every?", "not=", "ns", "ns-aliases", "ns-imports",
                   "ns-interns", "ns-map", "ns-name", "ns-publics", "ns-refers",
                   "ns-resolve", "ns-unalias", "ns-unmap", "nth", "nthnext", "nthrest",
                   "num", "number?", "numerator", "object-array", "odd?", "or", "parents",
                   "partial", "partition", "partition-all", "partition-by", "pcalls", "peek",
                   "persistent!", "pmap", "pop", "pop!", "pop-thread-bindings", "pos-int?",
                   "pos?", "pr", "pr-str", "prefer-method", "prefers",
                   "primitives-classnames", "print", "print-ctor", "print-dup",
                   "print-method", "print-simple", "print-str", "printf", "println",
                   "println-str", "prn", "prn-str", "promise", "proxy",
                   "proxy-call-with-super", "proxy-mappings", "proxy-name", "proxy-super",
                   "push-thread-bindings", "pvalues", "qualified-ident?",
                   "qualified-keyword?", "qualified-symbol?", "quot", "rand", "rand-int",
                   "rand-nth", "random-sample", "range", "ratio?", "rational?",
                   "rationalize", "re-find", "re-groups", "re-matcher", "re-matches",
                   "re-pattern", "re-seq", "read", "read-line", "read-string",
                   "reader-conditional", "reader-conditional?", "realized?", "record?",
                   "reduce", "reduce-kv", "reduced", "reduced?", "reductions", "ref",
                   "ref-history-count", "ref-max-history", "ref-min-history", "ref-set",
                   "refer", "refer-clojure", "reify", "release-pending-sends", "rem",
                   "remove", "remove-all-methods", "remove-method", "remove-ns",
                   "remove-watch", "repeat", "repeatedly", "replace", "replicate", "require",
                   "reset!", "reset-meta!", "reset-vals!", "resolve", "rest",
                   "restart-agent", "resultset-seq", "reverse", "reversible?", "rseq",
                   "rsubseq", "run!", "satisfies?", "second", "select-keys", "send",
                   "send-off", "send-via", "seq", "seq?", "seqable?", "seque", "sequence",
                   "sequential?", "set", "set-agent-send-executor!",
                   "set-agent-send-off-executor!", "set-error-handler!", "set-error-mode!",
                   "set-validator!", "set?", "short", "short-array", "shorts", "shuffle",
                   "shutdown-agents", "simple-ident?", "simple-keyword?", "simple-symbol?",
                   "slurp", "some", "some->", "some->>", "some-fn", "some?", "sort",
                   "sort-by", "sorted-map", "sorted-map-by", "sorted-set", "sorted-set-by",
                   "sorted?", "special-symbol?", "spit", "split-at", "split-with", "str",
                   "string?", "struct", "struct-map", "subs", "subseq", "subvec", "supers",
                   "swap!", "swap-vals!", "symbol", "symbol?", "sync", "tagged-literal",
                   "tagged-literal?", "take", "take-last", "take-nth", "take-while", "test",
                   "the-ns", "thread-bound?", "time", "to-array", "to-array-2d",
                   "trampoline", "transduce", "transient", "tree-seq", "true?", "type",
                   "unchecked-add", "unchecked-add-int", "unchecked-byte", "unchecked-char",
                   "unchecked-dec", "unchecked-dec-int", "unchecked-divide-int",
                   "unchecked-double", "unchecked-float", "unchecked-inc",
                   "unchecked-inc-int", "unchecked-int", "unchecked-long",
                   "unchecked-multiply", "unchecked-multiply-int", "unchecked-negate",
                   "unchecked-negate-int", "unchecked-remainder-int", "unchecked-short",
                   "unchecked-subtract", "unchecked-subtract-int", "underive", "unquote",
                   "unquote-splicing", "unreduced", "unsigned-bit-shift-right", "update",
                   "update-in", "update-proxy", "uri?", "use", "uuid?", "val", "vals",
                   "var-get", "var-set", "var?", "vary-meta", "vec", "vector", "vector-of",
                   "vector?", "volatile!", "volatile?", "vreset!", "vswap!", "when",
                   "when-first", "when-let", "when-not", "when-some", "while",
                   "with-bindings", "with-bindings*", "with-in-str", "with-loading-context",
                   "with-local-vars", "with-meta", "with-open", "with-out-str",
                   "with-precision", "with-redefs", "with-redefs-fn", "xml-seq", "zero?",
                   "zipmap"];
var haveBodyParameter = [
  "->", "->>", "as->", "binding", "bound-fn", "case", "catch", "comment",
  "cond", "cond->", "cond->>", "condp", "def", "definterface", "defmethod",
  "defn", "defmacro", "defprotocol", "defrecord", "defstruct", "deftype",
  "do", "doseq", "dotimes", "doto", "extend", "extend-protocol",
  "extend-type", "fn", "for", "future", "if", "if-let", "if-not", "if-some",
  "let", "letfn", "locking", "loop", "ns", "proxy", "reify", "struct-map",
  "some->", "some->>", "try", "when", "when-first", "when-let", "when-not",
  "when-some", "while", "with-bindings", "with-bindings*", "with-in-str",
  "with-loading-context", "with-local-vars", "with-meta", "with-open",
  "with-out-str", "with-precision", "with-redefs", "with-redefs-fn"];

var atom = createLookupMap(atoms);
var specialForm = createLookupMap(specialForms);
var coreSymbol = createLookupMap(coreSymbols);
var hasBodyParameter = createLookupMap(haveBodyParameter);
var delimiter = /^(?:[\\\[\]\s"(),;@^`{}~]|$)/;
var numberLiteral = /^(?:[+\-]?\d+(?:(?:N|(?:[eE][+\-]?\d+))|(?:\.?\d*(?:M|(?:[eE][+\-]?\d+))?)|\/\d+|[xX][0-9a-fA-F]+|r[0-9a-zA-Z]+)?(?=[\\\[\]\s"#'(),;@^`{}~]|$))/;
var characterLiteral = /^(?:\\(?:backspace|formfeed|newline|return|space|tab|o[0-7]{3}|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{4}|.)?(?=[\\\[\]\s"(),;@^`{}~]|$))/;

// simple-namespace := /^[^\\\/\[\]\d\s"#'(),;@^`{}~.][^\\\[\]\s"(),;@^`{}~.\/]*/
// simple-symbol    := /^(?:\/|[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)/
// qualified-symbol := (<simple-namespace>(<.><simple-namespace>)*</>)?<simple-symbol>
var qualifiedSymbol = /^(?:(?:[^\\\/\[\]\d\s"#'(),;@^`{}~.][^\\\[\]\s"(),;@^`{}~.\/]*(?:\.[^\\\/\[\]\d\s"#'(),;@^`{}~.][^\\\[\]\s"(),;@^`{}~.\/]*)*\/)?(?:\/|[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)*(?=[\\\[\]\s"(),;@^`{}~]|$))/;

function base(stream, state) {
  if (stream.eatSpace() || stream.eat(",")) return ["space", null];
  if (stream.match(numberLiteral)) return [null, "number"];
  if (stream.match(characterLiteral)) return [null, "string.special"];
  if (stream.eat(/^"/)) return (state.tokenize = inString)(stream, state);
  if (stream.eat(/^[(\[{]/)) return ["open", "bracket"];
  if (stream.eat(/^[)\]}]/)) return ["close", "bracket"];
  if (stream.eat(/^;/)) {stream.skipToEnd(); return ["space", "comment"];}
  if (stream.eat(/^[#'@^`~]/)) return [null, "meta"];

  var matches = stream.match(qualifiedSymbol);
  var symbol = matches && matches[0];

  if (!symbol) {
    // advance stream by at least one character so we don't get stuck.
    stream.next();
    stream.eatWhile(function (c) {return !is(c, delimiter);});
    return [null, "error"];
  }

  if (symbol === "comment" && state.lastToken === "(")
    return (state.tokenize = inComment)(stream, state);
  if (is(symbol, atom) || symbol.charAt(0) === ":") return ["symbol", "atom"];
  if (is(symbol, specialForm) || is(symbol, coreSymbol)) return ["symbol", "keyword"];
  if (state.lastToken === "(") return ["symbol", "builtin"]; // other operator

  return ["symbol", "variable"];
}

function inString(stream, state) {
  var escaped = false, next;

  while (next = stream.next()) {
    if (next === "\"" && !escaped) {state.tokenize = base; break;}
    escaped = !escaped && next === "\\";
  }

  return [null, "string"];
}

function inComment(stream, state) {
  var parenthesisCount = 1;
  var next;

  while (next = stream.next()) {
    if (next === ")") parenthesisCount--;
    if (next === "(") parenthesisCount++;
    if (parenthesisCount === 0) {
      stream.backUp(1);
      state.tokenize = base;
      break;
    }
  }

  return ["space", "comment"];
}

function createLookupMap(words) {
  var obj = {};

  for (var i = 0; i < words.length; ++i) obj[words[i]] = true;

  return obj;
}

function is(value, test) {
  if (test instanceof RegExp) return test.test(value);
  if (test instanceof Object) return test.propertyIsEnumerable(value);
}

const clojure = {
  startState: function () {
    return {
      ctx: {prev: null, start: 0, indentTo: 0},
      lastToken: null,
      tokenize: base
    };
  },

  token: function (stream, state) {
    if (stream.sol() && (typeof state.ctx.indentTo !== "number"))
      state.ctx.indentTo = state.ctx.start + 1;

    var typeStylePair = state.tokenize(stream, state);
    var type = typeStylePair[0];
    var style = typeStylePair[1];
    var current = stream.current();

    if (type !== "space") {
      if (state.lastToken === "(" && state.ctx.indentTo === null) {
        if (type === "symbol" && is(current, hasBodyParameter))
          state.ctx.indentTo = state.ctx.start + stream.indentUnit;
        else state.ctx.indentTo = "next";
      } else if (state.ctx.indentTo === "next") {
        state.ctx.indentTo = stream.column();
      }

      state.lastToken = current;
    }

    if (type === "open")
      state.ctx = {prev: state.ctx, start: stream.column(), indentTo: null};
    else if (type === "close") state.ctx = state.ctx.prev || state.ctx;

    return style;
  },

  indent: function (state) {
    var i = state.ctx.indentTo;

    return (typeof i === "number") ?
      i :
      state.ctx.start + 1;
  },

  languageData: {
    closeBrackets: {brackets: ["(", "[", "{", '"']},
    commentTokens: {line: ";;"},
    autocomplete: [].concat(atoms, specialForms, coreSymbols)
  }
};

var clojure$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  clojure: clojure
});

var ERRORCLASS = "error";

function wordRegexp(words) {
  return new RegExp("^((" + words.join(")|(") + "))\\b");
}

var operators = /^(?:->|=>|\+[+=]?|-[\-=]?|\*[\*=]?|\/[\/=]?|[=!]=|<[><]?=?|>>?=?|%=?|&=?|\|=?|\^=?|\~|!|\?|(or|and|\|\||&&|\?)=)/;
var delimiters = /^(?:[()\[\]{},:`=;]|\.\.?\.?)/;
var identifiers = /^[_A-Za-z$][_A-Za-z$0-9]*/;
var atProp = /^@[_A-Za-z$][_A-Za-z$0-9]*/;

var wordOperators = wordRegexp(["and", "or", "not",
                                "is", "isnt", "in",
                                "instanceof", "typeof"]);
var indentKeywords = ["for", "while", "loop", "if", "unless", "else",
                      "switch", "try", "catch", "finally", "class"];
var commonKeywords$1 = ["break", "by", "continue", "debugger", "delete",
                      "do", "in", "of", "new", "return", "then",
                      "this", "@", "throw", "when", "until", "extends"];

var keywords = wordRegexp(indentKeywords.concat(commonKeywords$1));

indentKeywords = wordRegexp(indentKeywords);


var stringPrefixes = /^('{3}|\"{3}|['\"])/;
var regexPrefixes = /^(\/{3}|\/)/;
var commonConstants = ["Infinity", "NaN", "undefined", "null", "true", "false", "on", "off", "yes", "no"];
var constants = wordRegexp(commonConstants);

// Tokenizers
function tokenBase$1(stream, state) {
  // Handle scope changes
  if (stream.sol()) {
    if (state.scope.align === null) state.scope.align = false;
    var scopeOffset = state.scope.offset;
    if (stream.eatSpace()) {
      var lineOffset = stream.indentation();
      if (lineOffset > scopeOffset && state.scope.type == "coffee") {
        return "indent";
      } else if (lineOffset < scopeOffset) {
        return "dedent";
      }
      return null;
    } else {
      if (scopeOffset > 0) {
        dedent(stream, state);
      }
    }
  }
  if (stream.eatSpace()) {
    return null;
  }

  var ch = stream.peek();

  // Handle docco title comment (single line)
  if (stream.match("####")) {
    stream.skipToEnd();
    return "comment";
  }

  // Handle multi line comments
  if (stream.match("###")) {
    state.tokenize = longComment;
    return state.tokenize(stream, state);
  }

  // Single line comment
  if (ch === "#") {
    stream.skipToEnd();
    return "comment";
  }

  // Handle number literals
  if (stream.match(/^-?[0-9\.]/, false)) {
    var floatLiteral = false;
    // Floats
    if (stream.match(/^-?\d*\.\d+(e[\+\-]?\d+)?/i)) {
      floatLiteral = true;
    }
    if (stream.match(/^-?\d+\.\d*/)) {
      floatLiteral = true;
    }
    if (stream.match(/^-?\.\d+/)) {
      floatLiteral = true;
    }

    if (floatLiteral) {
      // prevent from getting extra . on 1..
      if (stream.peek() == "."){
        stream.backUp(1);
      }
      return "number";
    }
    // Integers
    var intLiteral = false;
    // Hex
    if (stream.match(/^-?0x[0-9a-f]+/i)) {
      intLiteral = true;
    }
    // Decimal
    if (stream.match(/^-?[1-9]\d*(e[\+\-]?\d+)?/)) {
      intLiteral = true;
    }
    // Zero by itself with no other piece of number.
    if (stream.match(/^-?0(?![\dx])/i)) {
      intLiteral = true;
    }
    if (intLiteral) {
      return "number";
    }
  }

  // Handle strings
  if (stream.match(stringPrefixes)) {
    state.tokenize = tokenFactory(stream.current(), false, "string");
    return state.tokenize(stream, state);
  }
  // Handle regex literals
  if (stream.match(regexPrefixes)) {
    if (stream.current() != "/" || stream.match(/^.*\//, false)) { // prevent highlight of division
      state.tokenize = tokenFactory(stream.current(), true, "string.special");
      return state.tokenize(stream, state);
    } else {
      stream.backUp(1);
    }
  }



  // Handle operators and delimiters
  if (stream.match(operators) || stream.match(wordOperators)) {
    return "operator";
  }
  if (stream.match(delimiters)) {
    return "punctuation";
  }

  if (stream.match(constants)) {
    return "atom";
  }

  if (stream.match(atProp) || state.prop && stream.match(identifiers)) {
    return "property";
  }

  if (stream.match(keywords)) {
    return "keyword";
  }

  if (stream.match(identifiers)) {
    return "variable";
  }

  // Handle non-detected items
  stream.next();
  return ERRORCLASS;
}

function tokenFactory(delimiter, singleline, outclass) {
  return function(stream, state) {
    while (!stream.eol()) {
      stream.eatWhile(/[^'"\/\\]/);
      if (stream.eat("\\")) {
        stream.next();
        if (singleline && stream.eol()) {
          return outclass;
        }
      } else if (stream.match(delimiter)) {
        state.tokenize = tokenBase$1;
        return outclass;
      } else {
        stream.eat(/['"\/]/);
      }
    }
    if (singleline) {
      state.tokenize = tokenBase$1;
    }
    return outclass;
  };
}

function longComment(stream, state) {
  while (!stream.eol()) {
    stream.eatWhile(/[^#]/);
    if (stream.match("###")) {
      state.tokenize = tokenBase$1;
      break;
    }
    stream.eatWhile("#");
  }
  return "comment";
}

function indent(stream, state, type = "coffee") {
  var offset = 0, align = false, alignOffset = null;
  for (var scope = state.scope; scope; scope = scope.prev) {
    if (scope.type === "coffee" || scope.type == "}") {
      offset = scope.offset + stream.indentUnit;
      break;
    }
  }
  if (type !== "coffee") {
    align = null;
    alignOffset = stream.column() + stream.current().length;
  } else if (state.scope.align) {
    state.scope.align = false;
  }
  state.scope = {
    offset: offset,
    type: type,
    prev: state.scope,
    align: align,
    alignOffset: alignOffset
  };
}

function dedent(stream, state) {
  if (!state.scope.prev) return;
  if (state.scope.type === "coffee") {
    var _indent = stream.indentation();
    var matched = false;
    for (var scope = state.scope; scope; scope = scope.prev) {
      if (_indent === scope.offset) {
        matched = true;
        break;
      }
    }
    if (!matched) {
      return true;
    }
    while (state.scope.prev && state.scope.offset !== _indent) {
      state.scope = state.scope.prev;
    }
    return false;
  } else {
    state.scope = state.scope.prev;
    return false;
  }
}

function tokenLexer(stream, state) {
  var style = state.tokenize(stream, state);
  var current = stream.current();

  // Handle scope changes.
  if (current === "return") {
    state.dedent = true;
  }
  if (((current === "->" || current === "=>") && stream.eol())
      || style === "indent") {
    indent(stream, state);
  }
  var delimiter_index = "[({".indexOf(current);
  if (delimiter_index !== -1) {
    indent(stream, state, "])}".slice(delimiter_index, delimiter_index+1));
  }
  if (indentKeywords.exec(current)){
    indent(stream, state);
  }
  if (current == "then"){
    dedent(stream, state);
  }


  if (style === "dedent") {
    if (dedent(stream, state)) {
      return ERRORCLASS;
    }
  }
  delimiter_index = "])}".indexOf(current);
  if (delimiter_index !== -1) {
    while (state.scope.type == "coffee" && state.scope.prev)
      state.scope = state.scope.prev;
    if (state.scope.type == current)
      state.scope = state.scope.prev;
  }
  if (state.dedent && stream.eol()) {
    if (state.scope.type == "coffee" && state.scope.prev)
      state.scope = state.scope.prev;
    state.dedent = false;
  }

  return style == "indent" || style == "dedent" ? null : style;
}

const coffeeScript = {
  startState: function() {
    return {
      tokenize: tokenBase$1,
      scope: {offset: 0, type:"coffee", prev: null, align: false},
      prop: false,
      dedent: 0
    };
  },

  token: function(stream, state) {
    var fillAlign = state.scope.align === null && state.scope;
    if (fillAlign && stream.sol()) fillAlign.align = false;

    var style = tokenLexer(stream, state);
    if (style && style != "comment") {
      if (fillAlign) fillAlign.align = true;
      state.prop = style == "punctuation" && stream.current() == ".";
    }

    return style;
  },

  indent: function(state, text) {
    if (state.tokenize != tokenBase$1) return 0;
    var scope = state.scope;
    var closer = text && "])}".indexOf(text.charAt(0)) > -1;
    if (closer) while (scope.type == "coffee" && scope.prev) scope = scope.prev;
    var closes = closer && scope.type === text.charAt(0);
    if (scope.align)
      return scope.alignOffset - (closes ? 1 : 0);
    else
      return (closes ? scope.prev : scope).offset;
  },

  languageData: {
    commentTokens: {line: "#"}
  }
};

var coffeescript = /*#__PURE__*/Object.freeze({
  __proto__: null,
  coffeeScript: coffeeScript
});

var words = {};
function define(style, dict) {
  for(var i = 0; i < dict.length; i++) {
    words[dict[i]] = style;
  }
}
var commonAtoms = ["true", "false"];
var commonKeywords = ["if", "then", "do", "else", "elif", "while", "until", "for", "in", "esac", "fi",
                      "fin", "fil", "done", "exit", "set", "unset", "export", "function"];
var commonCommands = ["ab", "awk", "bash", "beep", "cat", "cc", "cd", "chown", "chmod", "chroot", "clear",
                      "cp", "curl", "cut", "diff", "echo", "find", "gawk", "gcc", "get", "git", "grep", "hg", "kill", "killall",
                      "ln", "ls", "make", "mkdir", "openssl", "mv", "nc", "nl", "node", "npm", "ping", "ps", "restart", "rm",
                      "rmdir", "sed", "service", "sh", "shopt", "shred", "source", "sort", "sleep", "ssh", "start", "stop",
                      "su", "sudo", "svn", "tee", "telnet", "top", "touch", "vi", "vim", "wall", "wc", "wget", "who", "write",
                      "yes", "zsh"];

define('atom', commonAtoms);
define('keyword', commonKeywords);
define('builtin', commonCommands);

function tokenBase(stream, state) {
  if (stream.eatSpace()) return null;

  var sol = stream.sol();
  var ch = stream.next();

  if (ch === '\\') {
    stream.next();
    return null;
  }
  if (ch === '\'' || ch === '"' || ch === '`') {
    state.tokens.unshift(tokenString(ch, ch === "`" ? "quote" : "string"));
    return tokenize(stream, state);
  }
  if (ch === '#') {
    if (sol && stream.eat('!')) {
      stream.skipToEnd();
      return 'meta'; // 'comment'?
    }
    stream.skipToEnd();
    return 'comment';
  }
  if (ch === '$') {
    state.tokens.unshift(tokenDollar);
    return tokenize(stream, state);
  }
  if (ch === '+' || ch === '=') {
    return 'operator';
  }
  if (ch === '-') {
    stream.eat('-');
    stream.eatWhile(/\w/);
    return 'attribute';
  }
  if (ch == "<") {
    if (stream.match("<<")) return "operator"
    var heredoc = stream.match(/^<-?\s*['"]?([^'"]*)['"]?/);
    if (heredoc) {
      state.tokens.unshift(tokenHeredoc(heredoc[1]));
      return 'string.special'
    }
  }
  if (/\d/.test(ch)) {
    stream.eatWhile(/\d/);
    if(stream.eol() || !/\w/.test(stream.peek())) {
      return 'number';
    }
  }
  stream.eatWhile(/[\w-]/);
  var cur = stream.current();
  if (stream.peek() === '=' && /\w+/.test(cur)) return 'def';
  return words.hasOwnProperty(cur) ? words[cur] : null;
}

function tokenString(quote, style) {
  var close = quote == "(" ? ")" : quote == "{" ? "}" : quote;
  return function(stream, state) {
    var next, escaped = false;
    while ((next = stream.next()) != null) {
      if (next === close && !escaped) {
        state.tokens.shift();
        break;
      } else if (next === '$' && !escaped && quote !== "'" && stream.peek() != close) {
        escaped = true;
        stream.backUp(1);
        state.tokens.unshift(tokenDollar);
        break;
      } else if (!escaped && quote !== close && next === quote) {
        state.tokens.unshift(tokenString(quote, style));
        return tokenize(stream, state)
      } else if (!escaped && /['"]/.test(next) && !/['"]/.test(quote)) {
        state.tokens.unshift(tokenStringStart(next, "string"));
        stream.backUp(1);
        break;
      }
      escaped = !escaped && next === '\\';
    }
    return style;
  };
}
function tokenStringStart(quote, style) {
  return function(stream, state) {
    state.tokens[0] = tokenString(quote, style);
    stream.next();
    return tokenize(stream, state)
  }
}

var tokenDollar = function(stream, state) {
  if (state.tokens.length > 1) stream.eat('$');
  var ch = stream.next();
  if (/['"({]/.test(ch)) {
    state.tokens[0] = tokenString(ch, ch == "(" ? "quote" : ch == "{" ? "def" : "string");
    return tokenize(stream, state);
  }
  if (!/\d/.test(ch)) stream.eatWhile(/\w/);
  state.tokens.shift();
  return 'def';
};

function tokenHeredoc(delim) {
  return function(stream, state) {
    if (stream.sol() && stream.string == delim) state.tokens.shift();
    stream.skipToEnd();
    return "string.special"
  }
}

function tokenize(stream, state) {
  return (state.tokens[0] || tokenBase) (stream, state);
}
const shell = {
  startState: function() {return {tokens:[]};},
  token: function(stream, state) {
    return tokenize(stream, state);
  },
  languageData: {
    autocomplete: commonAtoms.concat(commonKeywords, commonCommands),
    closeBrackets: {brackets: ["(", "[", "{", "'", '"', "`"]},
    commentTokens: {line: "#"}
  }
};

var shell$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  shell: shell
});

export { coffeescript as a, clojure$1 as c, shell$1 as s };
