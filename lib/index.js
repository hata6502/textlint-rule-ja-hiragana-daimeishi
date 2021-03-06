"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var fs = require("fs");
var kuromojin = require("kuromojin");
var createMatcher = require("morpheme-match-all");
var yaml = require("js-yaml");
var data = yaml.safeLoad(fs.readFileSync(__dirname + "/../dict/daimeishi.yml", "utf8"));

var dictionaries = [];

data.dict.forEach(function (item) {
  var form = "";
  item.tokens.forEach(function (token) {
    form += token.surface_form;
  });
  dictionaries.push({
    message: data.message + ": \"" + form + "\" => \"" + item.expected + "\"",
    fix: item.expected,
    tokens: item.tokens
  });
});

var matchAll = createMatcher(dictionaries);

function reporter(context) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var Syntax = context.Syntax,
      RuleError = context.RuleError,
      report = context.report,
      getSource = context.getSource,
      fixer = context.fixer;

  return _defineProperty({}, Syntax.Str, function (node) {
    // "Str" node
    var text = getSource(node); // Get text
    return kuromojin.tokenize(text).then(function (actualTokens) {
      var results = matchAll(actualTokens);

      if (results.length == 0) {
        return;
      }

      results.forEach(function (result) {
        var tokenIndex = result.index;
        var index = getIndexFromTokens(tokenIndex, actualTokens);
        var replaceFrom = "";
        result.tokens.forEach(function (token) {
          replaceFrom += token.surface_form;
        });
        var replaceTo = fixer.replaceTextRange([index, index + replaceFrom.length], result.dict.fix);
        var ruleError = new RuleError(result.dict.message, {
          index: index,
          fix: replaceTo // https://github.com/textlint/textlint/blob/master/docs/rule-fixable.md
        });
        report(node, ruleError);
      });
    });
  });
}

function getIndexFromTokens(tokenIndex, actualTokens) {
  var index = 0;
  for (var i = 0; i < tokenIndex; i++) {
    index += actualTokens[i].surface_form.length;
  }
  return index;
}

module.exports = {
  linter: reporter,
  fixer: reporter
};
//# sourceMappingURL=index.js.map