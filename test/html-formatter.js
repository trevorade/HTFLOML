(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
;
class HtmlFormatter {
    constructor(indentSize, wrappingColumn) {
        this.indentSize = indentSize;
        this.wrappingColumn = wrappingColumn;
    }
    static getLineType(line) {
        if (line.trim() === "") {
            return 4;
        }
        if (line.match(HtmlFormatter.COMMENT_TAG_REGEX)) {
            return 2;
        }
        if (line.match(HtmlFormatter.OPENING_TAG_REGEX)) {
            return 0;
        }
        if (line.match(HtmlFormatter.CLOSING_TAG_REGEX)) {
            return 1;
        }
        return 3;
    }
    static getOpeningTagName(openingTag) {
        return openingTag.match(HtmlFormatter.OPENING_TAG_REGEX)[1];
    }
    static getClosingTagName(openingTag) {
        return openingTag.match(HtmlFormatter.CLOSING_TAG_REGEX)[1];
    }
    static isVoidTag(tagName) {
        return HtmlFormatter.VOID_ELEMENT_NAMES.has(tagName);
    }
    static replaceWhiteSpace(text, replaceWhiteSpaceWith) {
        return text.replace(HtmlFormatter.WHITESPACE_REGEX, replaceWhiteSpaceWith).trim();
    }
    isShorterThanWrappingColumn(text, indentLevel) {
        return indentLevel * this.indentSize + text.length <= this.wrappingColumn;
    }
    insertAtIndentationLevel(textToInsert, html, indentLevel) {
        html += "\n";
        for (let indent = 0; indent < this.indentSize * indentLevel; indent++) {
            html += " ";
        }
        html += textToInsert;
        return html;
    }
    insertOpeningTag(openingTag, html, indentLevel) {
        let tagName = HtmlFormatter.getOpeningTagName(openingTag);
        let attributes = openingTag
            .slice(openingTag.indexOf(tagName) + tagName.length, openingTag.lastIndexOf(">"))
            .match(HtmlFormatter.ATTRIBUTE_REGEX) || [];
        let oneLineOpeningTag = attributes && attributes.length ?
            `<${tagName} ${attributes.join(" ")}>` :
            `<${tagName}>`;
        if (this.isShorterThanWrappingColumn(oneLineOpeningTag, indentLevel)) {
            return this.insertAtIndentationLevel(oneLineOpeningTag, html, indentLevel);
        }
        html = this.insertAtIndentationLevel(`<${tagName}`, html, indentLevel);
        attributes.forEach(attribute => {
            html = this.insertAtIndentationLevel(attribute, html, indentLevel + 2);
        });
        return this.insertAtIndentationLevel(">", html, indentLevel);
    }
    insertClosingTag(closingTag, html, indentLevel, previousLineType) {
        closingTag = HtmlFormatter.replaceWhiteSpace(closingTag, "");
        if (previousLineType === 0) {
            return html + closingTag;
        }
        let openingTagIndex = html.lastIndexOf(`<${HtmlFormatter.getClosingTagName(closingTag)}`);
        let oneLineElement = html
            .slice(openingTagIndex)
            .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .map(line => HtmlFormatter.replaceWhiteSpace(line, " "))
            .join("") + closingTag;
        if (oneLineElement.match(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX).length === 2 &&
            this.isShorterThanWrappingColumn(oneLineElement, indentLevel)) {
            return html.slice(0, openingTagIndex) + oneLineElement;
        }
        return this.insertAtIndentationLevel(closingTag, html, indentLevel);
    }
    insertText(text, html, indentLevel) {
        let oneLineText = HtmlFormatter.replaceWhiteSpace(text, " ");
        if (this.isShorterThanWrappingColumn(oneLineText, indentLevel)) {
            return this.insertAtIndentationLevel(oneLineText, html, indentLevel);
        }
        return this.insertAtIndentationLevel(text.trim(), html, indentLevel);
    }
    format(unformattedHtml) {
        let html = "";
        let indentLevel = 0;
        let previousLineType = 4;
        unformattedHtml
            .split(HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX)
            .forEach(line => {
            let lineType = HtmlFormatter.getLineType(line);
            let tagName = "";
            switch (lineType) {
                case 0:
                    html = this.insertOpeningTag(line, html, indentLevel);
                    indentLevel += HtmlFormatter.isVoidTag(HtmlFormatter.getOpeningTagName(line)) ? 0 : 1;
                    break;
                case 1:
                    if (!HtmlFormatter.isVoidTag(HtmlFormatter.getClosingTagName(line))) {
                        --indentLevel;
                        html = this.insertClosingTag(line, html, indentLevel, previousLineType);
                    }
                    break;
                case 2:
                case 3:
                    html = this.insertText(line, html, indentLevel);
                    break;
                case 4:
                    for (let i = 0; i < line.split("\n").length - 2; i++) {
                        html += "\n";
                    }
                    lineType = previousLineType;
                    break;
            }
            previousLineType = lineType;
        });
        return html.trim() + "\n";
    }
}
HtmlFormatter.OPENING_OR_CLOSING_TAG_REGEX = /(<[^>]*?(?:(?:"[^"]*?")[^>]*?)*>)/g;
HtmlFormatter.OPENING_TAG_REGEX = /<[\s\n]*([a-zA-Z0-9-]+)[\S\s]*>/;
HtmlFormatter.CLOSING_TAG_REGEX = /<[\s\n]*\/[\s\n]*([a-zA-Z0-9-]+)[\S\s]*?>/;
HtmlFormatter.COMMENT_TAG_REGEX = /<!--[\S\s]*?-->/;
HtmlFormatter.WHITESPACE_REGEX = /[\s\n]+/g;
HtmlFormatter.ATTRIBUTE_REGEX = /[a-zA-Z\-\(\)\*\[\]]+(="(?:[\S\s]{0,1}(?:\\"){0,1})*?"){0,1}/g;
HtmlFormatter.VOID_ELEMENT_NAMES = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]);
exports.HtmlFormatter = HtmlFormatter;

},{}]},{},[1]);
