var _ = require('underscore');
var resume = require('../Resume');
var fs = require('fs');
var dictionary = require('./../dictionary.js');

var profilesWatcher = {
  // for change value by reference
  inProgress: 0
};

module.exports = {
  parse: parse
};

function makeRegExpFromDictionary() {
  var regularRules = {
    titles: {},
    profiles: [],
    inline: {}
  };

  _.forEach(dictionary.titles, function(titles, key) {
    regularRules.titles[key] = [];
    _.forEach(titles, function(title) {
      regularRules.titles[key].push(title.toUpperCase());
      regularRules.titles[key].push(title[0].toUpperCase() + title.substr(1, title.length));
    });
  });

  _.forEach(dictionary.profiles, function(profile) {
    var profileHandler,profileExpr;

    if (_.isArray(profile)) {
      if (_.isFunction(profile[1])) {
        profileHandler = profile[1];
      }
      profile = profile[0];
    }
    profileExpr = "((?:https?:\/\/)?(?:www\\.)?"+profile.replace('.', "\\.")+"[\/\\w \\.-]*)";
    if (_.isFunction(profileHandler)) {
      regularRules.profiles.push([profileExpr, profileHandler]);
    } else {
      regularRules.profiles.push(profileExpr);
    }
  });

  _.forEach(dictionary.inline, function(expr, name) {
    regularRules.inline[name] = expr+":?[\\s]*(.*)";
  });

  return _.extend(dictionary, regularRules);
}

// dictionary is object, so it will be extended by reference
makeRegExpFromDictionary();

function parse(PreparedFile, cbReturnResume) {
  var rawFileData = PreparedFile.raw,
    Resume = new resume(),
    rows = rawFileData.split("\n"),
    row;

  // save prepared file text (for debug)
  //fs.writeFileSync('./parsed/'+PreparedFile.name + '.txt', rawFileData);

  // parse regulars
  parseDictionaryRegular(rawFileData, Resume);

  for (var i = 0; i < rows.length; i++) {
    row = rows[i];

    // parse profiles
    row = rows[i] = parseDictionaryProfiles(row, Resume);
    //  parse titles
    parseDictionaryTitles(Resume, rows, i);
    // parse inlines
    //parseDictionaryInline(Resume, row);
  }

  if (_.isFunction(cbReturnResume)) {
    // wait until download and handle internet profile
    var checkTimer = setInterval(function() {
      if (profilesWatcher.inProgress === 0) {
        cbReturnResume(Resume);
        clearInterval(checkTimer);
      }
    }, 200);
  } else {
    return console.error('cbReturnResume should be a function');
  }
}

/**
 * Make text from @rowNum index of @allRows to the end of @allRows
 * @param rowNum
 * @param allRows
 * @returns {string}
 */
function restoreTextByRows(rowNum, allRows) {
  rowNum = rowNum - 1;
  var rows = [];

  do {
    rows.push(allRows[rowNum]);
    rowNum++;
  } while(rowNum < allRows.length);

  return rows.join("\n");
}

/**
 * Count words in string
 * @param str
 * @returns {Number}
 */
function countWords(str) {
  return str.split(' ').length;
}

/**
 *
 * @param Resume
 * @param row
 */
function parseDictionaryInline(Resume, row) {
  var find;

  _.forEach(dictionary.inline, function(expression, key) {
    find = new RegExp(expression).exec(row);
    if (find) {
      Resume.addKey(key.toLowerCase(), find[1]);
    }
  });
}

/**
 *
 * @param data
 * @param Resume
 */
function parseDictionaryRegular(data, Resume) {
  var regularDictionary = dictionary.regular,find;
    //console.log(regularDictionary)

  _.forEach(regularDictionary, function(expressions, key) {
    _.forEach(expressions, function(expression) {
      //console.log(expressions)
      find = new RegExp(expression).exec(data);
      if (find) {
        Resume.addKey(key.toLowerCase(), find[0]);
      }
    });
  });
}

/**
 *
 * @param Resume
 * @param rows
 * @param rowIdx
 */
function parseDictionaryTitles(Resume, rows, rowIdx) {
  var allTitles = _.flatten(_.toArray(dictionary.titles)).join('|'),
    searchExpression = '',
    row = rows[rowIdx],
    ruleExpression,
    isRuleFound,
    result;

  _.forEach(dictionary.titles, function(expressions, key) {
    expressions = expressions || [];

    if (countWords(row) >= 1) {                                     //removed the 5 word array clause
      _.forEach(expressions, function(expression) {
        ruleExpression = new RegExp(expression);
        isRuleFound = ruleExpression.test(row);

        if (isRuleFound) {
          allTitles = _.without(allTitles.split('|'), key).join('|');
          searchExpression = '(?:' + expression + ')((.*\n)+?)(?:'+allTitles+'|{end})';
          // restore remaining text to search in relevant part of text
          result = new RegExp(searchExpression, 'gm').exec(restoreTextByRows(rowIdx, rows));

          if (result) {
            Resume.addKey(key, result[1]);
          }
        }
      });
    }
  });
}

/**
 *
 * @param row
 * @param Resume
 * @returns {*}
 */
function parseDictionaryProfiles(row, Resume) {
  var regularDictionary = dictionary.profiles,find,modifiedRow = row;

  _.forEach(regularDictionary, function(expression) {
    var expressionHandler;

    if (_.isArray(expression)) {
      if (_.isFunction(expression[1])) {
        expressionHandler = expression[1];
      }
      expression = expression[0];
    }
    find = new RegExp(expression).exec(row);
    if (find) {
      Resume.addKey('profiles', find[0] + "\n");
      modifiedRow = row.replace(find[0], '');
      if (_.isFunction(expressionHandler)) {
        profilesWatcher.inProgress++;
        expressionHandler(find[0], Resume, profilesWatcher);
      }
    }
  });

  return modifiedRow;
}