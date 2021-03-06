// src file
const onlineAdapters = require("../../" + generatedJsPath + "adapters/AdapterList.js").onlineAdapters;
const OnlineAdapter = require("../../" + generatedJsPath + "cornerstone/OnlineAdapter").OnlineAdapter;
const validBookIds = require("../../" + generatedJsPath + "interfaces/ICornerStone.js").bookIds;

// dependencies
const Logger = require("../../" + generatedJsPath + "cornerstone/Logger.js").Logger;
const LoggingLevel = require("../../" + generatedJsPath + "cornerstone/CommonEnums.js").LoggingLevel;
const isNode = require("../../" + generatedJsPath + "utilities/Platform.js").isNode;
const WebGetter = (isBrowser()) ?
      require("../../" + generatedJsPath + "utilities/BrowserWebGetter.js").BrowserWebGetter :
      require("../../" + generatedJsPath + "utilities/NodeWebGetter.js").NodeWebGetter;

const Book = require("../../" + generatedJsPath + "cornerstone/CommonEnums.js").Book;

const logger = new Logger({
      loggingEnabled: false,
      loggingLevel: LoggingLevel.DEBUG});
const webGetter = new WebGetter(logger);

let adapters = [];
for (let i = 0; i < onlineAdapters.length; i++) {
   adapters.push(new OnlineAdapter(logger, webGetter, onlineAdapters[i]));
}

function checkBibleContent(data)
{
   expect(typeof data.bookName).toBe("string");
   expect(data.bookName.length).toBeGreaterThan(0);
   expect(typeof data.ltr).toBe("boolean");
   expect(data.ltr).not.toBe(undefined);
   for (let verse of data.verses) {
      expect(typeof verse.verseNumber).toBe("number");
      expect(verse.verseNumber).toBeGreaterThan(0);
      expect(typeof verse.text).toBe("string");
      expect(verse.text.length).toBeGreaterThan(0);
   }
}

/**
 * Short book names (as short as possible, but long enough to validate)
 * to verify that books are correct and in the
 * corresponding position/index.
 */
let shortBookNames = [
   "gn", "ex", "lv",
   "nm", "de", "js",
   "jd", "r", "1s",
   "2s", "1k", "2k",
   "1c", "2c", "ez",
   "nh", "es", "jb",
   "ps", "pr", "ec",
   "so", "is", "jr",
   "la", "ez", "dn",
   "hs", "jo", "am",
   "ob", "jn", "mc",
   "na", "ha", "ze",
   "ha", "zc", "ml",
   "mt", "mr", "lk",
   "jh", "ac", "rm",
   "1c", "2c", "gl",
   "ep", "ph", "co",
   "1t", "2t", "1t",
   "2t", "ti", "ph",
   "hb", "js", "1p",
   "2p", "1j", "2j",
   "3j", "ju", "rv"
];

function compare(a, b)
{
   return (a.toLowerCase() === b.toLowerCase());
}

function checkCharacters(specialNeedle, haystack)
{
   // Check that haystack starts with the special needle and
   // the subsequent characters exist in the haystack.
   let status = false;
   // check first character
   if (specialNeedle.length > 0 && haystack.length > 0 &&
      (compare(specialNeedle.charAt(0), haystack.charAt(0)))) {
      let nIndex = 1;
      let hIndex = 1;
      // continue if first characters match
      for (; nIndex < specialNeedle.length && hIndex < haystack.length; nIndex++) {
         // move hIndex if characters don't match
         for (; hIndex < haystack.length &&
                compare(specialNeedle.charAt(nIndex), haystack.charAt(hIndex)); hIndex++) {}
         // move nIndex on match
      }
      // success if nIndex is at end
      status = (nIndex === specialNeedle.length);
   }
   return status;
}

describe("Adapters", () => {

   describe("Valid Books", () => {
      it("should have correct names and position", () => {
         // if false, check shortBookNames
         expect(validBookIds.length).toEqual(shortBookNames.length);
         for (let bookIndex = 0; bookIndex < validBookIds.length; bookIndex++) {
            if (!checkCharacters(shortBookNames[bookIndex], validBookIds[bookIndex])) {
               fail(shortBookNames[bookIndex] + " does not match " + validBookIds[bookIndex]);
            }
         }
      });
   });

   adapters.forEach((adapter) => {
      describe(adapter.getName(), () => {
         beforeEach(() => {
         });

         it("should have a name", () => {
            expect(adapter.getName().trim()).not.toEqual("");
         });

         it("should have a terms URL", () => {
            expect(adapter.getTermsUrl().trim()).not.toEqual("");
         });

         it("should have a text format", () => {
            let format = adapter.getTextFormat();
            expect(0 <= format && format <= 3).toBeTruthy();
         });

         it("should get languages", (done) => {
            adapter.getLanguages().then((data) => {
               expect(data.length).toBeGreaterThan(0);
               if (data.length > 0) {
                  // Check that each item contains the correct keys.
                  const expected = ["code", "name"];
                  const actual = Object.keys(data[0]).sort();
                  expect(actual).toEqual(expected);

                  // Check that all keys are defined
                  for (var i = 0; i < data.length; i++) {
                     expect(data[i].code).not.toBe(undefined, "Code for " + data[i].name + " is expected to be defined.");
                     expect(data[i].code).not.toBe(null, "Code for " + data[i].name + " is expected to not be null.");
                     expect(data[i].name).not.toBe(undefined, "Name for " + data[i].code + " is expected to be defined.");
                     expect(data[i].name).not.toBe(null, "Name for " + data[i].code + " is expected to not be null.");
                  }
               }
               done();
            }).catch((err) => {
               fail(err);
               done();
            });
         });

         it("should get versions", (done) => {
            adapter.getVersions("en").then((data) => {
               expect(data.length).toBeGreaterThan(0);

               var foundKjv = false;
               for (var version of data) {
                  // Expect the languages to match for all of the versions.
                  expect(version.lang).toEqual("en");
                  foundKjv = foundKjv || (version.code === "kjv");
                  expect(version.name).not.toEqual("", "Should not have an empty name for version code " + version.code);
               }
               expect(foundKjv).toBe(true, "Could not find code kjv.");
               done();
            }).catch((err) => {
               fail(err);
               done();
            });
         });

         it("should not get versions for an invalid language", (done) => {
            adapter.getVersions("nnnnnnnn").then((data) => {
               fail("Should not succeed for an invalid language.");
               done();
            }).catch((err) => {
               expect(err.message).toContain("invalid");
               done();
            });
         });

         it("should get a verse", (done) => {
            adapter.getVerse({ book: Book.JOHN, chapter: 3, verse: 18 }).then((data) => {
               checkBibleContent(data);
               let text = "He that believeth on him is not condemned";
               expect(data.verses[0].text.trim()).toContain(text);
               done();
            }).catch((err) => {
               fail(err);
               done();
            });
         });

         it("should get a chapter", (done) => {
            adapter.getChapter({ book: Book.PS, chapter: 117 }).then((data) => {
               checkBibleContent(data);
               expect(data.verses.length).toEqual(2);
               expect(data.verses[0].text).toContain("O praise the LORD");
               for (let key in data.verses) {
                  // Check that all verses are properly numbered.
                  expect(data.verses[key].verseNumber).toEqual(parseInt(key)+1);
               }
               done();
            }).catch((err) => {
               fail(err);
               done();
            });
         });

         it("should have correct book names and position", () => {
            expect(adapter.myBooks.length).toEqual(shortBookNames.length);
            for (let bookIndex = 0; bookIndex < adapter.myBooks.length; bookIndex++) {
               if (!checkCharacters(shortBookNames[bookIndex], adapter.myBooks[bookIndex])) {
                  fail(shortBookNames[bookIndex] + " does not match " + adapter.myBooks[bookIndex]);
               }
            }
         });

         it("should provide availability", (done) => {
            adapter.isAvailable()
               .then(() => { done(); })
               .catch((err) => {
                  fail(err);
                  done();
               });
         });

         // Test that the adapter returns verses in the format defined in the adapter.
      });
   });
});
