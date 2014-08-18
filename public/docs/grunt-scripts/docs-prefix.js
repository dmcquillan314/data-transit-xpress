var appConfig = {
    apiKey: 314
};

setHtmlIe8SafeWay = function(element, html) {
    var newElement = angular.element('<pre>' + html + '</pre>');

    element[0].innerHTML = "";
    element.append(newElement.contents());
    return element;
}