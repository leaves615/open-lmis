"use strict";
var page = require('webpage').create(),
    system = require('system'),
    common = require('./pdf-common');

var address = system.args[1];
var output = system.args[2];
var sessionId = system.args[3];
var domain = common.extractDomain(address);

phantom.addCookie({
    'name': 'JSESSIONID',
    'value': sessionId,
    'domain': domain
});

common.monitorResponses(page, address, onLoaded);

function adjustPageForRender() {
    page.evaluate(function () {

        function capturePages() {
            var viaPages = [];

            function saveCurrentPage() {
                $(".rnr-content").css('page-break-after', 'always');
                viaPages.push($(".rnr-content").clone());
            }

            saveCurrentPage();

            var nextPageLink = $('#nextPageLink');
            while (nextPageLink.parent().attr('class') != 'disabled') {
                nextPageLink.click();
                saveCurrentPage();
            }
            return viaPages;
        }

        function combineMutiplePages(pages) {
            var body = $(document.body);
            body.empty();
            pages.forEach(function (viaPage) {
                body.append(viaPage);
            });
            $('.text-align-right').hide();
        }

        var pages = capturePages();
        combineMutiplePages(pages);
    });
}

function onLoaded() {
    console.log("message loaded, prepare to render");

    window.setTimeout(function () {
        adjustPageForRender();
        page.render(output);
        phantom.exit();
    }, 200);
}
