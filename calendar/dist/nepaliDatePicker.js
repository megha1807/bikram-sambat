(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

function from(base) {
	function replacer(c) { return String.fromCharCode(Number(c) + base); }
	return function(original) {
		return original && original.toString().replace(/[0-9]/g, replacer);
	};
}

module.exports = {
	devanagari: from(2406),
	eastern_arabic: from(1632),
	perso_arabic: from(1776)
};

},{}],2:[function(require,module,exports){
var toDevanagari = require('eurodigit/src/to_non_euro').devanagari;
var MS_PER_DAY = 86400000;
var MONTH_NAMES = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत'];

// ------ TO UPDATE THESE HARDCODED VALUES USE /scripts/encode-days-in-month.js
// We have defined our own Epoch for Bikram Sambat: 1970-1-1 BS or 1913-4-13 AD
var BS_EPOCH_TS = -1789990200000; // = Date.parse('1913-4-13')
var BS_YEAR_ZERO = 1970;
var ENCODED_MONTH_LENGTHS = [
  5315258,5314490,9459438,8673005,5315258,5315066,9459438,8673005,5315258,5314298,9459438,5327594,5315258,5314298,9459438,5327594,5315258,5314286,9459438,5315306,5315258,5314286,8673006,5315306,5315258,5265134,8673006,5315258,5315258,9459438,8673005,5315258,5314298,9459438,8673005,5315258,5314298,9459438,8473322,5315258,5314298,9459438,5327594,5315258,5314298,9459438,5327594,5315258,5314286,8673006,5315306,5315258,5265134,8673006,5315306,5315258,9459438,8673005,5315258,5314490,9459438,8673005,5315258,5314298,9459438,8473325,5315258,5314298,9459438,5327594,5315258,5314298,9459438,5327594,5315258,5314286,9459438,5315306,5315258,5265134,8673006,5315306,5315258,5265134,8673006,5315258,5314490,9459438,8673005,5315258,5314298,9459438,8669933,5315258,5314298,9459438,8473322,5315258,5314298,9459438,5327594,5315258,5314286,9459438,5315306,5315258,5265134,8673006,5315306,5315258,5265134,8673006,5315258,5315258,5527226,5528046,5527277,5528250,5528057,5527277,5527277
];

// TODO ENCODED_MONTH_LENGTHS would be stored more efficiently converted to a string using
// String.fromCharCode.apply(String, ENCODED_MONTH_LENGTHS), and extracted using
// ENC_MTH.charCodeAt(...).  However, JS seems to do something weird with the
// top bits.

/**
 * Magic numbers:
 *   BS_YEAR_ZERO <- the first year (BS) encoded in ENCODED_MONTH_LENGTHS
 *   month #5 <- this is the only month which has a day variation of more than 1
 *   & 3 <- this is a 2 bit mask, i.e. 0...011
 */
function daysInMonth(year, month) {
  if(month < 1 || month > 12) throw new Error('Invalid month value ' + month);
  var delta = ENCODED_MONTH_LENGTHS[year - BS_YEAR_ZERO];
  if(typeof delta === 'undefined') throw new Error('No data for year: ' + year + ' BS');
  return 29 + ((delta >>>
      (((month-1) << 1))) & 3);
}

function zPad(x) { return x > 9 ? x : '0' + x; }

function toBik(greg) {
  // TODO do not use Date.parse(), as per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
  var m, dM, year = BS_YEAR_ZERO,
      days = Math.floor((Date.parse(greg) - BS_EPOCH_TS) / MS_PER_DAY) + 1;

  while(days > 0) {
    for(m=1; m<=12; ++m) {
      dM = daysInMonth(year, m);
      if(days <= dM) return { year:year, month:m, day:days };
      days -= dM;
    }
    ++year;
  }

  throw new Error('Date outside supported range: ' + greg + ' AD');
}

function toDev(year, month, day) {
  return {
    day: toDevanagari(day),
    month: MONTH_NAMES[month-1],
    year: toDevanagari(year)
  };
}

function toBik_euro(greg) {
  var d = toBik(greg);
  return d.year + '-' + zPad(d.month) + '-' + zPad(d.day);
}

function toBik_dev(greg) {
  return toDevanagari(toBik_euro(greg));
}

function toBik_text(greg) {
  var bik = toBik(greg);
  var dev = toDev(bik.year, bik.month, bik.day);
  return dev.day + ' ' + dev.month + ' ' + dev.year;
}

function toGreg(year, month, day) {
  // TODO month bounds-checking should be handled in daysInMonth()
  if(month < 1) throw new Error('Invalid month value ' + month);
  if(year < BS_YEAR_ZERO) throw new Error('Invalid year value ' + year);
  if(day < 1 || day > daysInMonth(year, month)) throw new Error('Invalid day value', day);

  var timestamp = BS_EPOCH_TS + (MS_PER_DAY * day);
  month--;

  while (year >= BS_YEAR_ZERO) {
    while (month > 0) {
      timestamp += (MS_PER_DAY * daysInMonth(year, month));
      month--;
    }
    month = 12;
    year--;
  }

  var d = new Date(timestamp);
  return {
    year: d.getUTCFullYear(),
    month: 1+d.getUTCMonth(),
    day: d.getUTCDate()
  };
}

function toGreg_text(year, month, day) {
  var d = toGreg(year, month, day);
  return d.year + '-' + zPad(d.month) + '-' + zPad(d.day);
}

module.exports = {
  daysInMonth: daysInMonth,
  toBik: toBik,
  toDev: toDev,
  toBik_dev: toBik_dev,
  toBik_euro: toBik_euro,
  toBik_text: toBik_text,
  toGreg: toGreg,
  toGreg_text: toGreg_text
};

},{"eurodigit/src/to_non_euro":1}],3:[function(require,module,exports){
/*
 * @fileOverview NepaliDatePicker - jQuery Plugin
 * @version 2.0.1
 *
 * @author Sanish Maharjan https://github.com/sanishmaharjan
 * @see https://github.com/sanishmaharjan/
 *
 * Forked and modified by Medic to delegate all date logic to the bikram-sambat library.
 */
var bs = require('bikram-sambat');
var calendarFunctions = {};
(function ($) {
  var calendarData = {
    bsMonths: ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फागुन', 'चैत'],
    bsDays: ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'],
    nepaliNumbers: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
    minBsYear: 1970,
    maxBsYear: 2090
  };

  var validationFunctions = {
    validateRequiredParameters: function (requiredParameters) {
      $.each(requiredParameters, function (key, value) {
        if (typeof value === 'undefined' || value === null) {
          throw new ReferenceError('Missing required parameters: ' + Object.keys(requiredParameters).join(', '));
        }
      });
    },
    validateBsYear: function (bsYear) {
      if (typeof bsYear !== 'number' || bsYear === null) {
        throw new TypeError('Invalid parameter bsYear value');
      } else if (bsYear < calendarData.minBsYear || bsYear > calendarData.maxBsYear) {
        throw new RangeError(
          'Parameter bsYear value should be in range of ' + calendarData.minBsYear + ' to ' + calendarData.maxBsYear
        );
      }
    },
    validateAdYear: function (adYear) {
      if (typeof adYear !== 'number' || adYear === null) {
        throw new TypeError('Invalid parameter adYear value');
      } else if (adYear < calendarData.minBsYear - 57 || adYear > calendarData.maxBsYear - 57) {
        throw new RangeError(
          'Parameter adYear value should be in range of ' +
            (calendarData.minBsYear - 57) +
            ' to ' +
            (calendarData.maxBsYear - 57)
        );
      }
    },
    validateBsMonth: function (bsMonth) {
      if (typeof bsMonth !== 'number' || bsMonth === null) {
        throw new TypeError('Invalid parameter bsMonth value');
      } else if (bsMonth < 1 || bsMonth > 12) {
        throw new RangeError('Parameter bsMonth value should be in range of 1 to 12');
      }
    },
    validateAdMonth: function (adMonth) {
      if (typeof adMonth !== 'number' || adMonth === null) {
        throw new TypeError('Invalid parameter adMonth value');
      } else if (adMonth < 1 || adMonth > 12) {
        throw new RangeError('Parameter adMonth value should be in range of 1 to 12');
      }
    },
    validateBsDate: function (bsDate) {
      if (typeof bsDate !== 'number' || bsDate === null) {
        throw new TypeError('Invalid parameter bsDate value');
      } else if (bsDate < 1 || bsDate > 32) {
        throw new RangeError('Parameter bsDate value should be in range of 1 to 32');
      }
    },
    validateAdDate: function (adDate) {
      if (typeof adDate !== 'number' || adDate === null) {
        throw new TypeError('Invalid parameter adDate value');
      } else if (adDate < 1 || adDate > 31) {
        throw new RangeError('Parameter adDate value should be in range of 1 to 31');
      }
    },
    validatePositiveNumber: function (numberParameters) {
      $.each(numberParameters, function (key, value) {
        if (typeof value !== 'number' || value === null || value < 0) {
          throw new ReferenceError('Invalid parameters: ' + Object.keys(numberParameters).join(', '));
        } else if (key === 'yearDiff' && value > calendarData.maxBsYear - calendarData.minBsYear + 1) {
          throw new RangeError(
            'Parameter yearDiff value should be in range of 0 to ' +
              (calendarData.maxBsYear - calendarData.minBsYear + 1)
          );
        }
      });
    }
  };

  $.extend(calendarFunctions, {
    getNepaliNumber: function (number) {
      if (typeof number === 'undefined') {
        throw new Error('Parameter number is required');
      } else if (typeof number != 'number' || number < 0) {
        throw new Error('Number should be positive integer');
      }

      var prefixNum = Math.floor(number / 10);
      var suffixNum = number % 10;
      if (prefixNum !== 0) {
        return calendarFunctions.getNepaliNumber(prefixNum) + calendarData.nepaliNumbers[suffixNum];
      } else {
        return calendarData.nepaliNumbers[suffixNum];
      }
    },
    getNumberByNepaliNumber: function (nepaliNumber) {
      if (typeof nepaliNumber === 'undefined') {
        throw new Error('Parameter nepaliNumber is required');
      } else if (typeof nepaliNumber !== 'string') {
        throw new Error('Parameter nepaliNumber should be in string');
      }

      var number = 0;
      for (var i = 0; i < nepaliNumber.length; i++) {
        var numIndex = calendarData.nepaliNumbers.indexOf(nepaliNumber.charAt(i));
        if (numIndex === -1) {
          throw new Error('Invalid nepali number');
        }
        number = number * 10 + numIndex;
      }

      return number;
    },
    getBsMonthInfoByBsDate: function (bsYear, bsMonth, bsDate, dateFormatPattern) {
      validationFunctions.validateRequiredParameters({
        bsYear: bsYear,
        bsMonth: bsMonth,
        bsDate: bsDate
      });
      validationFunctions.validateBsYear(bsYear);
      validationFunctions.validateBsMonth(bsMonth);
      validationFunctions.validateBsDate(bsDate);
      if (dateFormatPattern === null) {
        dateFormatPattern = '%D, %M %d, %y';
      } else if (typeof dateFormatPattern != 'string') {
        throw new TypeError('Invalid parameter dateFormatPattern value');
      }

      var bsMonthFirstAdDate = calendarFunctions.getAdDateByBsDate(bsYear, bsMonth, 1);
      var bsMonthDays = calendarFunctions.getBsMonthDays(bsYear, bsMonth);
      bsDate = bsDate > bsMonthDays ? bsMonthDays : bsDate;
      var eqAdDate = calendarFunctions.getAdDateByBsDate(bsYear, bsMonth, bsDate);
      var weekDay = eqAdDate.getDay() + 1;
      var formattedDate = calendarFunctions.bsDateFormat(dateFormatPattern, bsYear, bsMonth, bsDate);
      return {
        bsYear: bsYear,
        bsMonth: bsMonth,
        bsDate: bsDate,
        weekDay: weekDay,
        formattedDate: formattedDate,
        adDate: eqAdDate,
        bsMonthFirstAdDate: bsMonthFirstAdDate,
        bsMonthDays: bsMonthDays
      };
    },
    getAdDateByBsDate: function (bsYear, bsMonth, bsDate) {
      validationFunctions.validateRequiredParameters({
        bsYear: bsYear,
        bsMonth: bsMonth,
        bsDate: bsDate
      });
      validationFunctions.validateBsYear(bsYear);
      validationFunctions.validateBsMonth(bsMonth);
      validationFunctions.validateBsDate(bsDate);

      try {
        var greg = bs.toGreg(bsYear, bsMonth, bsDate);
        return new Date(greg.year, greg.month - 1, greg.day);
      } catch (e) {
        return null;
      }
    },
    getBsMonthDays: function (bsYear, bsMonth) {
      validationFunctions.validateRequiredParameters({
        bsYear: bsYear,
        bsMonth: bsMonth
      });
      validationFunctions.validateBsYear(bsYear);
      validationFunctions.validateBsMonth(bsMonth);

      try {
        return bs.daysInMonth(bsYear, bsMonth);
      } catch (e) {
        return null;
      }
    },
    getBsDateByAdDate: function (adYear, adMonth, adDate) {
      validationFunctions.validateRequiredParameters({
        adYear: adYear,
        adMonth: adMonth,
        adDate: adDate
      });
      validationFunctions.validateAdYear(adYear);
      validationFunctions.validateAdMonth(adMonth);
      validationFunctions.validateAdDate(adDate);

      var pad = function (n) { return n < 10 ? '0' + n : n; };
      var formattedAd = adYear + '-' + pad(adMonth) + '-' + pad(adDate);
      try {
        var bik = bs.toBik(formattedAd);
        return {
          bsYear: bik.year,
          bsMonth: bik.month,
          bsDate: bik.day
        };
      } catch (e) {
        return null;
      }
    },
    getBsYearByAdDate: function (adYear, adMonth, adDate) {
      validationFunctions.validateRequiredParameters({
        adYear: adYear,
        adMonth: adMonth,
        adDate: adDate
      });
      validationFunctions.validateAdYear(adYear);
      validationFunctions.validateAdMonth(adMonth);
      validationFunctions.validateAdDate(adDate);

      var bsDate = calendarFunctions.getBsDateByAdDate(adYear, adMonth, adDate);
      return bsDate ? bsDate.bsYear : null;
    },
    getBsMonthByAdDate: function (adYear, adMonth, adDate) {
      validationFunctions.validateRequiredParameters({
        adYear: adYear,
        adMonth: adMonth,
        adDate: adDate
      });
      validationFunctions.validateAdYear(adYear);
      validationFunctions.validateAdMonth(adMonth);
      validationFunctions.validateAdDate(adDate);

      var bsDate = calendarFunctions.getBsDateByAdDate(adYear, adMonth, adDate);
      return bsDate ? bsDate.bsMonth : null;
    },
    bsDateFormat: function (dateFormatPattern, bsYear, bsMonth, bsDate) {
      validationFunctions.validateRequiredParameters({
        dateFormatPattern: dateFormatPattern,
        bsYear: bsYear,
        bsMonth: bsMonth,
        bsDate: bsDate
      });
      validationFunctions.validateBsYear(bsYear);
      validationFunctions.validateBsMonth(bsMonth);
      validationFunctions.validateBsDate(bsDate);

      var eqAdDate = calendarFunctions.getAdDateByBsDate(bsYear, bsMonth, bsDate);
      var weekDay = eqAdDate.getDay() + 1;
      var formattedDate = dateFormatPattern;
      formattedDate = formattedDate.replace(/%d/g, calendarFunctions.getNepaliNumber(bsDate));
      formattedDate = formattedDate.replace(/%y/g, calendarFunctions.getNepaliNumber(bsYear));
      formattedDate = formattedDate.replace(/%m/g, calendarFunctions.getNepaliNumber(bsMonth));
      formattedDate = formattedDate.replace(/%M/g, calendarData.bsMonths[bsMonth - 1]);
      formattedDate = formattedDate.replace(/%D/g, calendarData.bsDays[weekDay - 1]);
      return formattedDate;
    },
    parseFormattedBsDate: function (dateFormat, dateFormattedText) {
      validationFunctions.validateRequiredParameters({
        dateFormat: dateFormat,
        dateFormattedText: dateFormattedText
      });

      var diffTextNum = 0;
      var extractedFormattedBsDate = {
        bsYear: null,
        bsMonth: null,
        bsDate: null,
        bsDay: null
      };

      for (var i = 0; i < dateFormat.length; i++) {
        if (dateFormat.charAt(i) === '%') {
          var valueOf = dateFormat.substring(i, i + 2);
          var endChar = dateFormat.charAt(i + 2);
          var tempText = dateFormattedText.substring(i + diffTextNum);
          var endIndex = endChar !== '' ? tempText.indexOf(endChar) : tempText.length;
          var value = tempText.substring(0, endIndex);

          if (valueOf === '%y') {
            extractedFormattedBsDate.bsYear = calendarFunctions.getNumberByNepaliNumber(value);
            diffTextNum += value.length - 2;
          } else if (valueOf === '%d') {
            extractedFormattedBsDate.bsDate = calendarFunctions.getNumberByNepaliNumber(value);
            diffTextNum += value.length - 2;
          } else if (valueOf === '%D') {
            extractedFormattedBsDate.bsDay = calendarData.bsDays.indexOf(value) + 1;
            diffTextNum += value.length - 2;
          } else if (valueOf === '%m') {
            extractedFormattedBsDate.bsMonth = calendarFunctions.getNumberByNepaliNumber(value);
            diffTextNum += value.length - 2;
          } else if (valueOf === '%M') {
            extractedFormattedBsDate.bsMonth = calendarData.bsMonths.indexOf(value) + 1;
            diffTextNum += value.length - 2;
          }
        }
      }

      if (!extractedFormattedBsDate.bsDay) {
        var eqAdDate = calendarFunctions.getAdDateByBsDate(
          extractedFormattedBsDate.bsYear,
          extractedFormattedBsDate.bsMonth,
          extractedFormattedBsDate.bsDate
        );
        extractedFormattedBsDate.bsDay = eqAdDate.getDay() + 1;
      }

      return extractedFormattedBsDate;
    }
  });

  $.fn.nepaliDatePicker = function (options) {
    var datePickerPlugin = {
      options: $.extend(
        {
          dateFormat: '%D, %M %d, %y',
          closeOnDateSelect: true,
          defaultDate: '',
          minDate: null,
          maxDate: null,
          yearStart: calendarData.minBsYear,
          yearEnd: calendarData.maxBsYear
        },
        options
      ),
      init: function ($element) {
        $element.prop('readonly', true);
        var $nepaliDatePicker = $('<div class="nepali-date-picker">');
        $('body').append($nepaliDatePicker);
        if ($element.val() !== '') {
          datePickerPlugin.renderFormattedSpecificDateCalendar(
            $nepaliDatePicker,
            datePickerPlugin.options.dateFormat,
            $element.val()
          );
        } else {
          datePickerPlugin.renderCurrentMonthCalendar($nepaliDatePicker);
        }
        datePickerPlugin.addEventHandler($element, $nepaliDatePicker);
        datePickerPlugin.addCommonEventHandler($nepaliDatePicker);
      },
      addCommonEventHandler: function () {
        var $datePickerWrapper = $('.nepali-date-picker');
        $(document).click(function (event) {
          var $targetElement = $(event.target);
          if (!$targetElement.is($('.nepali-date-picker'))) {
            $datePickerWrapper.hide();
            $datePickerWrapper.find('.drop-down-content').hide();
          }
        });
      },
      addEventHandler: function ($element, $nepaliDatePicker) {
        $element.click(function () {
          if ($('.nepali-date-picker').is(':visible')) {
            $('.nepali-date-picker').hide();
            return;
          }

          var inputFieldPosition = $(this).offset();
          $nepaliDatePicker.css({
            top: inputFieldPosition.top + $(this).outerHeight(true),
            left: inputFieldPosition.left
          });

          if ($element.val()) {
            datePickerPlugin.renderFormattedSpecificDateCalendar(
              $nepaliDatePicker,
              datePickerPlugin.options.dateFormat,
              $element.val()
            );
          }
          $nepaliDatePicker.show();
          datePickerPlugin.eventFire($element, $nepaliDatePicker, 'show');

          return false;
        });

        $nepaliDatePicker.on('click', '.next-btn', function (event) {
          event.preventDefault();
          var preCalendarData = {
            bsYear: $nepaliDatePicker.data().bsYear,
            bsMonth: $nepaliDatePicker.data().bsMonth,
            bsDate: $nepaliDatePicker.data().bsDate
          };
          datePickerPlugin.renderNextMonthCalendar($nepaliDatePicker);
          datePickerPlugin.triggerChangeEvent($element, $nepaliDatePicker, preCalendarData);
          $nepaliDatePicker.show();

          return false;
        });

        $nepaliDatePicker.on('click', '.prev-btn', function (event) {
          event.preventDefault();
          var preCalendarData = {
            bsYear: $nepaliDatePicker.data().bsYear,
            bsMonth: $nepaliDatePicker.data().bsMonth,
            bsDate: $nepaliDatePicker.data().bsDate
          };
          datePickerPlugin.renderPreviousMonthCalendar($nepaliDatePicker);
          var calendarData = $nepaliDatePicker.data();
          datePickerPlugin.triggerChangeEvent($element, $nepaliDatePicker, preCalendarData);
          $nepaliDatePicker.show();

          return false;
        });

        $nepaliDatePicker.on('click', '.today-btn', function (event) {
          event.preventDefault();
          var preCalendarData = {
            bsYear: $nepaliDatePicker.data().bsYear,
            bsMonth: $nepaliDatePicker.data().bsMonth,
            bsDate: $nepaliDatePicker.data().bsDate
          };
          datePickerPlugin.renderCurrentMonthCalendar($nepaliDatePicker);
          var calendarData = $nepaliDatePicker.data();
          datePickerPlugin.triggerChangeEvent($element, $nepaliDatePicker, preCalendarData);
          $nepaliDatePicker.show();

          return false;
        });

        $nepaliDatePicker.on('click', '.current-year-txt, .current-month-txt', function () {
          if (!$(this).find('.drop-down-content').is(':visible')) {
            $nepaliDatePicker.find('.drop-down-content').hide();
            $(this).find('.drop-down-content').show();
            var $optionWrapper = $(this).find('.option-wrapper');
            $optionWrapper.scrollTop(0);
            var scrollTopTo = $optionWrapper.find('.active').position().top;
            $optionWrapper.scrollTop(scrollTopTo);
          } else {
            $(this).find('.drop-down-content').hide();
          }

          return false;
        });

        $nepaliDatePicker.on('click', '.current-month-date', function () {
          if ($(this).hasClass('disable')) {
            return;
          }

          var datePickerData = $nepaliDatePicker.data();
          var bsYear = datePickerData.bsYear;
          var bsMonth = datePickerData.bsMonth;
          var preDate = datePickerData.bsDate;
          var bsDate = $(this).data('date');
          var dateText = calendarFunctions.bsDateFormat(datePickerPlugin.options.dateFormat, bsYear, bsMonth, bsDate);
          $element.val(dateText);
          datePickerPlugin.setCalendarDate($nepaliDatePicker, bsYear, bsMonth, bsDate);
          datePickerPlugin.renderMonthCalendar($nepaliDatePicker);

          if (preDate !== bsDate) datePickerPlugin.eventFire($element, $nepaliDatePicker, 'dateChange');
          datePickerPlugin.eventFire($element, $nepaliDatePicker, 'dateSelect');

          if (datePickerPlugin.options.closeOnDateSelect) {
            $nepaliDatePicker.hide();
          } else {
            $nepaliDatePicker.show();
          }

          return false;
        });

        $nepaliDatePicker.on('click', '.drop-down-content li', function () {
          var $dropDown = $(this).parents('.drop-down-content');
          $dropDown.data('value', $(this).data('value'));
          $dropDown.attr('data-value', $(this).data('value'));

          var preCalendarData = {
            bsYear: $nepaliDatePicker.data().bsYear,
            bsMonth: $nepaliDatePicker.data().bsMonth,
            bsDate: $nepaliDatePicker.data().bsDate
          };
          var bsMonth = $nepaliDatePicker.find('.month-drop-down').data('value');
          var bsYear = $nepaliDatePicker.find('.year-drop-down').data('value');
          var bsDate = preCalendarData.bsDate;
          datePickerPlugin.setCalendarDate($nepaliDatePicker, bsYear, bsMonth, bsDate);
          datePickerPlugin.renderMonthCalendar($nepaliDatePicker);
          var calendarData = $nepaliDatePicker.data();
          datePickerPlugin.triggerChangeEvent($element, $nepaliDatePicker, preCalendarData);
          $nepaliDatePicker.show();

          return false;
        });
      },
      triggerChangeEvent: function ($element, $nepaliDatePicker, preCalendarData) {
        var calendarData = $nepaliDatePicker.data();
        if (preCalendarData.bsYear !== calendarData.bsYear) {
          datePickerPlugin.eventFire($element, $nepaliDatePicker, 'yearChange');
        }

        if (preCalendarData.bsMonth !== calendarData.bsMonth) {
          datePickerPlugin.eventFire($element, $nepaliDatePicker, 'monthChange');
        }

        if (preCalendarData.bsDate !== calendarData.bsDate) {
          datePickerPlugin.eventFire($element, $nepaliDatePicker, 'dateChange');
        }
      },
      eventFire: function ($element, $nepaliDatePicker, eventType) {
        switch (eventType) {
          case 'generate':
            $element.trigger({
              type: eventType,
              message: 'Nepali date picker initialize',
              datePickerData: $nepaliDatePicker.data(),
              time: new Date()
            });
            break;
          case 'show':
            $element.trigger({
              type: eventType,
              message: 'Show nepali date picker',
              datePickerData: $nepaliDatePicker.data(),
              time: new Date()
            });
            break;
          case 'close':
            $element.trigger({
              type: eventType,
              message: 'close nepali date picker',
              datePickerData: $nepaliDatePicker.data(),
              time: new Date()
            });
            break;
          case 'dateSelect':
            $element.trigger({
              type: eventType,
              message: 'Select date',
              datePickerData: $nepaliDatePicker.data(),
              time: new Date()
            });
            break;
          case 'dateChange':
            $element.trigger({
              type: eventType,
              message: 'Change date',
              datePickerData: $nepaliDatePicker.data(),
              time: new Date()
            });
            break;
          case 'monthChange':
            $element.trigger({
              type: eventType,
              message: 'Change month',
              datePickerData: $nepaliDatePicker.data(),
              time: new Date()
            });
            break;
          case 'yearChange':
            $element.trigger({
              type: eventType,
              message: 'Change year',
              datePickerData: $nepaliDatePicker.data(),
              time: new Date()
            });
            break;
          default:
            break;
        }
      },
      setCalendarDate: function ($nepaliDatePicker, bsYear, bsMonth, BsDate) {
        $nepaliDatePicker.data(
          calendarFunctions.getBsMonthInfoByBsDate(bsYear, bsMonth, BsDate, datePickerPlugin.options.dateFormat)
        );
      },
      renderMonthCalendar: function ($nepaliDatePicker) {
        $nepaliDatePicker.find('.calendar-wrapper').remove();
        $nepaliDatePicker.append(datePickerPlugin.getCalendar($nepaliDatePicker)).hide();
      },
      getCalendar: function ($nepaliDatePicker) {
        var calendarWrapper = $('<div class="calendar-wrapper">');
        calendarWrapper.append(datePickerPlugin.getCalendarController($nepaliDatePicker));
        var calendarTable = $('<table>');
        calendarTable.append(datePickerPlugin.getCalendarHeader());
        calendarTable.append(datePickerPlugin.getCalendarBody($nepaliDatePicker));
        calendarWrapper.append(calendarTable);

        return calendarWrapper;
      },
      getCalendarController: function ($nepaliDatePicker) {
        var calendarController = $("<div class='calendar-controller'>");
        calendarController.append('<a href="javascript:void(0);" class="prev-btn icon" title="prev"></a>');
        calendarController.append('<a href="javascript:void(0);" class="today-btn icon" title=""></a>');
        calendarController.append(datePickerPlugin.getMonthDropOption($nepaliDatePicker));
        calendarController.append(datePickerPlugin.getYearDropOption($nepaliDatePicker));
        calendarController.append('<a href="javascript:void(0);" class="next-btn icon" title="next"></a>');

        return calendarController;
      },
      getMonthDropOption: function ($nepaliDatePicker) {
        var datePickerData = $nepaliDatePicker.data();
        var $monthSpan = $('<div class="current-month-txt">');
        $monthSpan.text(calendarData.bsMonths[datePickerData.bsMonth - 1]);
        $monthSpan.append('<i class="icon icon-drop-down">');

        var data = [];
        for (var i = 0; i < 12; i++) {
          data.push({
            label: calendarData.bsMonths[i],
            value: i + 1
          });
        }

        var $monthDropOption = datePickerPlugin
          .getCustomSelectOption(data, datePickerData.bsMonth)
          .addClass('month-drop-down');
        $monthSpan.append($monthDropOption);

        return $monthSpan;
      },
      getYearDropOption: function ($nepaliDatePicker) {
        var datePickerData = $nepaliDatePicker.data();
        var $yearSpan = $('<div class="current-year-txt">');
        $yearSpan.text(calendarFunctions.getNepaliNumber(datePickerData.bsYear));
        $yearSpan.append('<i class="icon icon-drop-down">');
        var data = [];
        for (var i = datePickerPlugin.options.yearStart; i <= datePickerPlugin.options.yearEnd; i++) {
          data.push({
            label: calendarFunctions.getNepaliNumber(i),
            value: i
          });
        }

        var $yearDropOption = datePickerPlugin
          .getCustomSelectOption(data, datePickerData.bsYear)
          .addClass('year-drop-down');
        $yearSpan.append($yearDropOption);

        return $yearSpan;
      },
      getCustomSelectOption: function (datas, activeValue) {
        var $dropDown = $('<div class="drop-down-content" data-value="' + activeValue + '">');
        var $dropDownWrapper = $('<div class="option-wrapper">');
        var $ul = $('<ul>');
        $.each(datas, function (index, data) {
          $ul.append('<li data-value="' + data.value + '">' + data.label + '</li>');
        });

        $dropDownWrapper.append($ul);
        $ul.find('li[data-value="' + activeValue + '"]').addClass('active');
        $dropDown.append($dropDownWrapper);

        return $dropDown;
      },
      getCalendarHeader: function () {
        var calendarHeader = $('<thead>');
        var tableRow = $('<tr>');
        for (var i = 0; i < 7; i++) {
          tableRow.append('<td>' + calendarData.bsDays[i] + '</td>');
        }

        calendarHeader.append(tableRow);
        return calendarHeader;
      },
      getCalendarBody: function ($nepaliDatePicker) {
        var datePickerData = $nepaliDatePicker.data();
        var weekCoverInMonth = Math.ceil((datePickerData.bsMonthFirstAdDate.getDay() + datePickerData.bsMonthDays) / 7);
        var preMonth = datePickerData.bsMonth - 1 !== 0 ? datePickerData.bsMonth - 1 : 12;
        var preYear = preMonth === 12 ? datePickerData.bsYear - 1 : datePickerData.bsYear;
        var preMonthDays = preYear >= calendarData.minBsYear ? calendarFunctions.getBsMonthDays(preYear, preMonth) : 30;
        var minBsDate = null;
        var maxBsDate = null;

        if (datePickerPlugin.options.minDate !== null) {
          minBsDate = calendarFunctions.parseFormattedBsDate(
            datePickerPlugin.options.dateFormat,
            datePickerPlugin.options.minDate
          );
        }
        if (datePickerPlugin.options.maxDate !== null) {
          maxBsDate = calendarFunctions.parseFormattedBsDate(
            datePickerPlugin.options.dateFormat,
            datePickerPlugin.options.maxDate
          );
        }
        var calendarBody = $('<tbody>');
        for (var i = 0; i < weekCoverInMonth; i++) {
          var tableRow = $('<tr>');
          for (var k = 1; k <= 7; k++) {
            var calendarDate = i * 7 + k - datePickerData.bsMonthFirstAdDate.getDay();
            var isCurrentMonthDate = true;
            if (calendarDate <= 0) {
              calendarDate = preMonthDays + calendarDate;
              isCurrentMonthDate = false;
            } else if (calendarDate > datePickerData.bsMonthDays) {
              calendarDate = calendarDate - datePickerData.bsMonthDays;
              isCurrentMonthDate = false;
            }

            if (isCurrentMonthDate) {
              var $td = $(
                '<td class="current-month-date" data-date="' +
                  calendarDate +
                  '" data-weekDay="' +
                  (k - 1) +
                  '">' +
                  calendarFunctions.getNepaliNumber(calendarDate) +
                  '</td>'
              );
              if (calendarDate == datePickerData.bsDate) {
                $td.addClass('active');
              }
              datePickerPlugin.disableIfOutOfRange($td, datePickerData, minBsDate, maxBsDate, calendarDate);
              tableRow.append($td);
            } else {
              tableRow.append(
                '<td class="other-month-date">' + calendarFunctions.getNepaliNumber(calendarDate) + '</td>'
              );
            }
          }

          calendarBody.append(tableRow);
        }

        return calendarBody;
      },
      disableIfOutOfRange: function ($td, datePickerData, minBsDate, maxBsDate, calendarDate) {
        if (minBsDate !== null) {
          if (datePickerData.bsYear < minBsDate.bsYear) {
            $td.addClass('disable');
          } else if (datePickerData.bsYear === minBsDate.bsYear && datePickerData.bsMonth < minBsDate.bsMonth) {
            $td.addClass('disable');
          } else if (
            datePickerData.bsYear === minBsDate.bsYear &&
            datePickerData.bsMonth === minBsDate.bsMonth &&
            calendarDate < minBsDate.bsDate
          ) {
            $td.addClass('disable');
          }
        }

        if (maxBsDate !== null) {
          if (datePickerData.bsYear > maxBsDate.bsYear) {
            $td.addClass('disable');
          } else if (datePickerData.bsYear === maxBsDate.bsYear && datePickerData.bsMonth > maxBsDate.bsMonth) {
            $td.addClass('disable');
          } else if (
            datePickerData.bsYear === maxBsDate.bsYear &&
            datePickerData.bsMonth === maxBsDate.bsMonth &&
            calendarDate > maxBsDate.bsDate
          ) {
            $td.addClass('disable');
          }
        }

        return $td;
      },
      renderCurrentMonthCalendar: function ($nepaliDatePicker) {
        var currentDate = new Date();
        var currentBsDate = calendarFunctions.getBsDateByAdDate(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          currentDate.getDate()
        );
        var bsYear = currentBsDate.bsYear;
        var bsMonth = currentBsDate.bsMonth;
        var bsDate = currentBsDate.bsDate;
        datePickerPlugin.setCalendarDate($nepaliDatePicker, bsYear, bsMonth, bsDate);
        datePickerPlugin.renderMonthCalendar($nepaliDatePicker);
      },
      renderPreviousMonthCalendar: function ($nepaliDatePicker) {
        var datePickerData = $nepaliDatePicker.data();
        var prevMonth = datePickerData.bsMonth - 1 > 0 ? datePickerData.bsMonth - 1 : 12;
        var prevYear = prevMonth !== 12 ? datePickerData.bsYear : datePickerData.bsYear - 1;
        var prevDate = datePickerData.bsDate;
        if (prevYear < datePickerPlugin.options.yearStart || prevYear > datePickerPlugin.options.yearEnd) {
          return null;
        }
        datePickerPlugin.setCalendarDate($nepaliDatePicker, prevYear, prevMonth, prevDate);
        datePickerPlugin.renderMonthCalendar($nepaliDatePicker);
      },
      renderNextMonthCalendar: function ($nepaliDatePicker) {
        var datePickerData = $nepaliDatePicker.data();
        var nextMonth = datePickerData.bsMonth + 1 <= 12 ? datePickerData.bsMonth + 1 : 1;
        var nextYear = nextMonth !== 1 ? datePickerData.bsYear : datePickerData.bsYear + 1;
        var nextDate = datePickerData.bsDate;
        if (nextYear < datePickerPlugin.options.yearStart || nextYear > datePickerPlugin.options.yearEnd) {
          return null;
        }
        datePickerPlugin.setCalendarDate($nepaliDatePicker, nextYear, nextMonth, nextDate);
        datePickerPlugin.renderMonthCalendar($nepaliDatePicker);
      },
      renderFormattedSpecificDateCalendar: function ($nepaliDatePicker, dateFormat, dateFormattedText) {
        var datePickerDate = calendarFunctions.parseFormattedBsDate(dateFormat, dateFormattedText);
        datePickerPlugin.setCalendarDate(
          $nepaliDatePicker,
          datePickerDate.bsYear,
          datePickerDate.bsMonth,
          datePickerDate.bsDate
        );
        datePickerPlugin.renderMonthCalendar($nepaliDatePicker);
      }
    };

    this.each(function () {
      var $element = $(this);
      datePickerPlugin.init($element);
    });

    datePickerPlugin.addCommonEventHandler();
    return this;
  };
})(jQuery, calendarFunctions);


if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calendarFunctions: calendarFunctions
  };
}

},{"bikram-sambat":2}]},{},[3]);
