"use strict";
const html_formatter_1 = require("./html-formatter");
describe("html-formatter", () => {
    let htfloml;
    beforeAll(() => {
        htfloml = new html_formatter_1.HTfloML(2, 100);
    });
    it("should format basic html", () => {
        expect(htfloml.formatHtml(`
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
            .toEqual(`<body class="something" other-class="meh" ng-if="1 > 2">
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
        expect(htfloml.insertOpeningTag("<body>", "<html>", 1))
            .toEqual("<html>\n  <body>");
        expect(htfloml.insertOpeningTag(`<body class="classname">`, "<html>", 1))
            .toEqual(`<html>\n  <body class="classname">`);
    });
    it("should recognize text nodes", function () {
        expect(html_formatter_1.HTfloML
            .getHtmlType("        tex text      "))
            .toBe(4);
        expect(html_formatter_1.HTfloML.getHtmlType("text"))
            .toBe(4);
    });
    it("should recognize commest nodes", function () {
        expect(html_formatter_1.HTfloML
            .getHtmlType("<!-- I'm a comment look at me -->"))
            .toBe(3);
        expect(html_formatter_1.HTfloML.getHtmlType("    <!-- 1 > 2 && 2 < 1 -->   "))
            .toBe(3);
    });
    it("should recognize opening tags", function () {
        expect(html_formatter_1.HTfloML
            .getHtmlType(`<body class="something" other-class="meh">`))
            .toBe(0);
        expect(html_formatter_1.HTfloML.getHtmlType("<body>"))
            .toBe(0);
    });
    it("should recognize closing tags", function () {
        expect(html_formatter_1.HTfloML
            .getHtmlType("</body>"))
            .toBe(1);
        expect(html_formatter_1.HTfloML.getHtmlType("</ body>"))
            .toBe(1);
    });
});
