/*global logger*/
/*
    Remember search
    ========================

    @file      : RememberSearch.js
    @version   : 0.1
    @author    : Joost Verhoog
    @date      : Tue, 25 Apr 2017 10:45:55 GMT
    @copyright : Mendix 2
    @license   : Apache 2

    Documentation
    ========================
    Remembers the user's last search.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",

    "mxui/dom",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dijit/layout/LinkPane"
], function(declare, _WidgetBase, dom, domStyle, domAttr, domConstruct, lang, LinkPane) {
    "use strict";

    return declare("RememberSearch.widget.RememberSearch", [_WidgetBase], {

        _objectChangeHandler: null,

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
        },

        startup: function() {
            logger.debug(this.id + ".startup");
            this.executeCode();
        },

        executeCode: function() {
            logger.debug(this.id + ".executeCode");
            require([
                "RememberSearch/lib/jquery-1.11.2"
            ], lang.hitch(this, this.execute));
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            if (this.refreshOnContextChange) {
                this.executeCode();

                if (this.refreshOnContextUpdate) {
                    if (this._objectChangeHandler !== null) {
                        this.unsubscribe(this._objectChangeHandler);
                    }
                    if (obj) {
                        this._objectChangeHandler = this.subscribe({
                            guid: obj.getGuid(),
                            callback: lang.hitch(this, function() {
                                this.executeCode();
                            })
                        });
                    }
                }
            }

            this._executeCallback(callback, "update");
        },

        execute: function() {
            var getSearchBar = function (elem) {
                return elem.parents('.mx-grid-searchbar');
            };

            var getCookieName = function (searchBar) {
                return 'searchValues_' + searchBar.parent().attr('mxid');
            };
            
            var preventSetCookie = false;
            var searchAutomatically = this.searchAutomatically;
            
            var fillForm = function () {
                preventSetCookie = true;
                // check if cookie exists, and if so, execute search
                $('.mx-grid-searchbar').each(function () {
                    var searchBar = $(this);
                    var cookieName = getCookieName(searchBar);
                    var regexp = '(?:(?:^|.*;\\s*)' + cookieName + '\\s*\\=\\s*([^;]*).*$)|^.*$';
                    var cookieValue = document.cookie.replace(new RegExp(regexp), "$1");
                    if (!cookieValue) 
                        return;
                    var values = JSON.parse(decodeURIComponent(cookieValue));
                    if (!values) 
                        return;
                    searchBar.find('input, textarea').each(function () {
                        if ($(this).val())
                            return;
                        $(this).val(values.shift());
                    });
                    searchBar.find('select').each(function () {
                        if ($(this).val())
                            return;
                        $(this).val($(this).find('option:contains(\'' + values.shift() + '\')').attr('value'));
                    });
                    searchBar.show();
                    if (searchAutomatically) {
                        searchBar.find('.mx-grid-search-button').click();
                    }
                });
                preventSetCookie = false;
            };

            $(function() {
                // Search button sets a cookie
                $('.mx-grid-search-button').click(function () {
                    if (preventSetCookie)
                        return;
                    var searchBar = getSearchBar($(this));
                    var cookieName = getCookieName(searchBar);
                    var values = [];
                    searchBar.find('input, textarea').each(function () {
                        values.push($(this).val());
                    });
                    searchBar.find('select').each(function () {
                        values.push($(this).find('option:selected').text());
                    });
                    document.cookie = cookieName + '=' + encodeURIComponent(JSON.stringify(values));
                });

                // Reset button clears the cookie
                $('.mx-grid-reset-button').click(function () {
                    var searchBar = getSearchBar($(this));
                    var cookieName = getCookieName(searchBar);
                    document.cookie = cookieName + '=null';
                });
                
                setTimeout(fillForm, 1);
            });

            setTimeout(fillForm, 1);
        },
        
        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["RememberSearch/widget/RememberSearch"]);
