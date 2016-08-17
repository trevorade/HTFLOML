(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
class HtmlFormatter {
    constructor(indentSize, characterLimit) {
        this.indentSize = indentSize;
        this.chracterLimit = characterLimit;
    }
    /**
     * Leaf elements
     *   Placed on one indented line if shorter than the character limit.
     * Opening tags
     *   Placed on one indented line if shorter than the character limit.
     *   Otherwise, each attribute is placed on an lines further indented 2 levels.
     * Closing tags
     *   Immediately after the opening tag if element is empty or shorter than the character limit.
     *   Otherwise, on one indented line.
     * Comment tags
     *   Placed on one indented line if shorter than the character limit.
     *   Otherwise, paragraphs (delimited by empty new lines) wrap at the character limit.
     * Text nodes
     *   Placed on one indented line if shorter than the character limit.
     *   Otherwise, paragraphs (delimited by two or more consequtive new lines) wrap at the character limit.
     */
    formatHtml(unformattedHtml) {
        let indentLevel = 0;
        return unformattedHtml
            .split(HtmlRegExp.CAPTURE_TAGS)
            .reduce((html, tag) => {
            switch (HtmlFormatter.getHtmlType(tag)) {
                case 6 /* DOCTYPE */: return this.insertDoctype(tag, html, indentLevel);
                case 0 /* OPENING_TAG */: return this.insertOpeningTag(tag, html, indentLevel++);
                case 1 /* CLOSING_TAG */: return this.insertClosingTag(tag, html, --indentLevel);
                case 2 /* VOID_TAG */: return this.insertVoidTag(tag, html, indentLevel);
                case 3 /* COMMENT_TAG */: return this.insertCommentTag(tag, html, indentLevel);
                case 4 /* TEXT_NODE */: return this.insertTextNode(tag, html, indentLevel);
                case 5 /* WHITESPACE */: return this.insertWhitespace(tag, html);
                default: return html;
            }
        }, "")
            .trim() + "\n";
    }
    insertDoctype(doctype, html, indentLevel) {
        const doctypeContents = doctype.slice(doctype.indexOf('DOCTYPE') + 'DOCTYPE'.length, doctype.lastIndexOf('>'));
        return `<!DOCTYPE ${HtmlFormatter.normalizeWhitespace(doctypeContents)}>`;
    }
    /**
     * Inserted on one indented line if shorter than the character limit.
     * Otherwise, each attribute is inserted on a new line further indented 2 levels.
     */
    insertOpeningTag(openingTag, html, indentLevel) {
        const tagName = HtmlFormatter.getTagName(openingTag);
        const attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .match(HtmlRegExp.ATTRIBUTE);
        const oneLineOpeningTag = attributes ? `<${tagName} ${attributes.join(" ")}>` : `<${tagName}>`;
        if (this.shorterThanCharacterLimit(oneLineOpeningTag, indentLevel)) {
            return this.insertIndentedLine(oneLineOpeningTag, html, indentLevel);
        }
        const htmlWithTagName = this.insertIndentedLine(`<${tagName}`, html, indentLevel);
        const htmlWithAttributes = attributes.reduce((html, attribute) => this.insertIndentedLine(attribute, html, indentLevel + 2), htmlWithTagName);
        return this.insertIndentedLine(">", htmlWithAttributes, indentLevel);
    }
    /**
     * Insert leaf elements on one indented line if shorter than the character limit.
     * Insert closing tags of elements with not content immediately after the opening tag if shorter
     *   than the character limit.
     * Otherwise, insert closing tags on new indented lines.
     */
    insertClosingTag(closingTag, html, indentLevel) {
        const tagName = HtmlFormatter.getTagName(closingTag);
        const formattedClosingTag = `</${tagName}>`;
        const trimmedHtml = html.trim();
        const elementStartIndex = trimmedHtml.lastIndexOf(`<${tagName}`);
        const unclosedElement = trimmedHtml.slice(elementStartIndex);
        const oneLineElement = unclosedElement
            .split("\n")
            .map(HtmlFormatter.normalizeWhitespace)
            .join("") + formattedClosingTag;
        const isLeafElement = oneLineElement.match(HtmlRegExp.CAPTURE_TAGS).length === 2;
        if (isLeafElement) {
            if (this.shorterThanCharacterLimit(oneLineElement, indentLevel)) {
                return trimmedHtml.slice(0, elementStartIndex) + oneLineElement;
            }
        }
        const openingTag = unclosedElement.match(HtmlRegExp.OPENING_TAG)[0];
        const elementIsEmpty = trimmedHtml.length === elementStartIndex + openingTag.length;
        if (elementIsEmpty) {
            const lastLineTrimmed = HtmlFormatter.getLastLineTrimmed(html) + formattedClosingTag;
            if (this.shorterThanCharacterLimit(lastLineTrimmed, indentLevel)) {
                return trimmedHtml + formattedClosingTag;
            }
        }
        return this.insertIndentedLine(formattedClosingTag, trimmedHtml, indentLevel);
    }
    insertVoidTag(voidTag, html, indentLevel) {
        return HtmlRegExp.CLOSING_TAG.test(voidTag) ? html :
            this.insertOpeningTag(voidTag, html, indentLevel);
    }
    /**
     * Inserted on one indented line if shorter than the character limit.
     * Otherwise, insert paragraphs (delimited by empty new lines) which wrap at the character limit.
     */
    insertCommentTag(commentTag, html, indentLevel) {
        const comment = commentTag.trim().slice(4, -3);
        const oneLineCommentTag = `<!-- ${HtmlFormatter.normalizeWhitespace(comment)} -->`;
        if (this.shorterThanCharacterLimit(oneLineCommentTag, indentLevel)) {
            return this.insertIndentedLine(oneLineCommentTag, html, indentLevel);
        }
        const htmlWithCommentOpening = this.insertIndentedLine("<!--", html, indentLevel);
        const htmlWithComment = this.insertTextNode(comment, htmlWithCommentOpening, indentLevel + 2);
        return this.insertIndentedLine("-->", htmlWithComment, indentLevel);
    }
    /**
     * Inserted on one indented line if shorter than the character limit.
     * Otherwise, insert paragraphs (delimited by empty new lines) which wrap at the character limit.
     */
    insertTextNode(content, html, indentLevel) {
        const oneLineText = HtmlFormatter.normalizeWhitespace(content);
        if (this.shorterThanCharacterLimit(oneLineText, indentLevel)) {
            return this.insertIndentedLine(oneLineText, html, indentLevel);
        }
        const formattedContent = content
            .split(HtmlRegExp.PARAGRAPH_DELIMITER)
            .map(paragraph => {
            return paragraph
                .split(HtmlRegExp.WHITESPACE)
                .reduce((indentedParagraph, word) => {
                const lastLineTrimmed = HtmlFormatter.getLastLineTrimmed(indentedParagraph);
                const indentedWord = (lastLineTrimmed === "" ? "" : " ") + word;
                if (this.shorterThanCharacterLimit(lastLineTrimmed + indentedWord, indentLevel)) {
                    return indentedParagraph + indentedWord;
                }
                return this.insertIndentedLine(word, indentedParagraph, indentLevel);
            }, this.insertIndentedLine("", "", indentLevel));
        })
            .join("\n")
            .trim();
        return this.insertIndentedLine(formattedContent, html, indentLevel);
    }
    insertWhitespace(whitespace, html) {
        return html + (whitespace.match(/\n/g) || []).slice(1).join("");
    }
    static getHtmlType(html) {
        if (html.match(HtmlRegExp.CAPTURE_TAGS)) {
            const tagName = HtmlFormatter.getTagName(html);
            return VoidTagNameSet.has(tagName) ? 2 /* VOID_TAG */ :
                HtmlRegExp.DOCTYPE.test(html) ? 6 /* DOCTYPE */ :
                    HtmlRegExp.COMMENT_TAG.test(html) ? 3 /* COMMENT_TAG */ :
                        HtmlRegExp.CLOSING_TAG.test(html) ? 1 /* CLOSING_TAG */ :
                            0 /* OPENING_TAG */;
        }
        return html.trim() === "" ? 5 /* WHITESPACE */ :
            4 /* TEXT_NODE */;
    }
    /** Returns the tag names of opening, closing and void tags, the empty string otherwise. */
    static getTagName(tag) {
        const match = tag.match(HtmlRegExp.TAG_NAME);
        return match ? match[1] : "";
    }
    /**
     * Strips leading and trailing white space and replaces sequences of white space characters with a
     * single space.
     */
    static normalizeWhitespace(text) {
        return text.replace(HtmlRegExp.WHITESPACE, " ").trim();
    }
    /**
     * Returns the last line of a string of text with the leading and trailing whitespace removed.
     * */
    static getLastLineTrimmed(text) {
        return text.slice(Math.max(text.lastIndexOf("\n"), 0)).trim();
    }
    ;
    insertIndentedLine(textToInsert, html, indentLevel) {
        const indentSize = Math.max(0, this.indentSize * indentLevel);
        return `${html}\n${" ".repeat(indentSize)}${textToInsert}`;
    }
    shorterThanCharacterLimit(text, indentLevel) {
        return indentLevel * this.indentSize + text.length <= this.chracterLimit;
    }
}
exports.HtmlFormatter = HtmlFormatter;
/** Set of "void" tag names, i.e. tags that do not need to be closed. */
const VoidTagNameSet = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
/**
 * Regular Expressions use for paring HTML. For more details see:
 * http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454
 */
const HtmlRegExp = {
    DOCTYPE: /<!DOCTYPE[\S\s]*?>/,
    // Captures opening closing, comment and void tags.
    CAPTURE_TAGS: /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g,
    // Matches opening tags.
    OPENING_TAG: /<[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    // Matches closing tags.
    CLOSING_TAG: /<[\s\n]*\/[\s\n]*[a-zA-Z0-9-]+[\S\s]*?>/,
    // Matches opening or closing tags.
    TAG_NAME: /<[\s\n]*\/{0,1}[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/,
    // Matches comment tags.
    COMMENT_TAG: /<!--[\S\s]*?-->/,
    // Matches whitespace (including new lines).
    WHITESPACE: /[\s\n]+/g,
    // Matches empty lines.
    PARAGRAPH_DELIMITER: /\n[\s\n]*\n/,
    // Matches attributes wrapped in double quotes. Ignores espaped quotes inside attributes.
    ATTRIBUTE: /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g,
};

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../typings/jasmine/jasmine.d.ts" />
const html_formatter_1 = require("./html-formatter");
describe("html-formatter", () => {
    let htmlFormatter;
    beforeAll(() => {
        htmlFormatter = new html_formatter_1.HtmlFormatter(2, 100);
    });
    it("should format basic html", () => {
        expect(htmlFormatter.formatHtml(`
    <!DOCTYPE some string     that shouldn't     be

        altered >
<body class="something" other-class="meh" ng-if="1 > 2" >

tex text
<span></span>
<span>asd
f
a<div>ad
f</div></span>

<custom-element-3 ng-if="1 < 2" class="one two three four five six seven eight twelve"></custom-element-3>
<custom-element-4 ng-if="1 < 2">
something
</custom-element-4>
<custom-element-5 ng-if="1 < 2" class="one two three four five six seven eight nine ten eleven twelve">

    something

456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789

456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
</custom-element-5>
<input type="text"></input>

<!-- some comment -->
<!--

6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789

6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 -->
<img src="http://img.com/image">

<span
class="one two three four five six seven eight nine ten eleven" ng-repeat="whatever in whateverList track by whatever"><
/  span>
</ body>`))
            .toEqual(`<!DOCTYPE some string that shouldn't be altered>
<body class="something" other-class="meh" ng-if="1 > 2">
  tex text
  <span></span>
  <span>
    asd f a
    <div>ad f</div>
  </span>

  <custom-element-3 ng-if="1 < 2" class="one two three four five six seven eight twelve">
  </custom-element-3>
  <custom-element-4 ng-if="1 < 2">something</custom-element-4>
  <custom-element-5
      ng-if="1 < 2"
      class="one two three four five six seven eight nine ten eleven twelve"
  >
    something

    456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
    456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789

    456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
    456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
  </custom-element-5>
  <input type="text">

  <!-- some comment -->
  <!--
      6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
      6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789

      6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
      6789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789
  -->
  <img src="http://img.com/image">

  <span
      class="one two three four five six seven eight nine ten eleven"
      ng-repeat="whatever in whateverList track by whatever"
  ></span>
</body>
`);
    });
    it("should insert opening tags", function () {
        expect(htmlFormatter.insertOpeningTag("<body>", "<html>", 1))
            .toEqual("<html>\n  <body>");
        expect(htmlFormatter.insertOpeningTag(`<body class="classname">`, "<html>", 1))
            .toEqual(`<html>\n  <body class="classname">`);
    });
    it("should recognize text nodes", function () {
        expect(html_formatter_1.HtmlFormatter
            .getHtmlType("        tex text      "))
            .toBe(4 /* TEXT_NODE */);
        expect(html_formatter_1.HtmlFormatter.getHtmlType("text"))
            .toBe(4 /* TEXT_NODE */);
    });
    it("should recognize commest nodes", function () {
        expect(html_formatter_1.HtmlFormatter
            .getHtmlType("<!-- I'm a comment look at me -->"))
            .toBe(3 /* COMMENT_TAG */);
        expect(html_formatter_1.HtmlFormatter.getHtmlType("    <!-- 1 > 2 && 2 < 1 -->   "))
            .toBe(3 /* COMMENT_TAG */);
    });
    it("should recognize opening tags", function () {
        expect(html_formatter_1.HtmlFormatter
            .getHtmlType(`<body class="something" other-class="meh">`))
            .toBe(0 /* OPENING_TAG */);
        expect(html_formatter_1.HtmlFormatter.getHtmlType("<body>"))
            .toBe(0 /* OPENING_TAG */);
    });
    it("should recognize closing tags", function () {
        expect(html_formatter_1.HtmlFormatter
            .getHtmlType("</body>"))
            .toBe(1 /* CLOSING_TAG */);
        expect(html_formatter_1.HtmlFormatter.getHtmlType("</ body>"))
            .toBe(1 /* CLOSING_TAG */);
    });
});

},{"./html-formatter":1}]},{},[2]);
