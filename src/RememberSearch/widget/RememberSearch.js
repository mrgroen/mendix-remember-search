/*global logger*/
/*
    Remember search
    ========================

    @file      : RememberSearch.js
    @version   : 1.2.0
    @author    : Joost Verhoog
    @date      : Mon, 12 Jun 2017 13:00:00 GMT
    @copyright : Mendix
    @license   : Apache 2.0

    Documentation
    ========================
    Remembers the user's last search.

    Modified by
    ========================
    Marcus Groen
*/

define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "mxui/dom",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dijit/layout/LinkPane",
    "RememberSearch/lib/jquery-1.12.4"
], function (declare, _WidgetBase, dom, domStyle, domAttr, domConstruct, lang, LinkPane, _jQuery) {
    "use strict";

    return declare("RememberSearch.widget.RememberSearch", [_WidgetBase], {

        _objectChangeHandler: null,

        startup: function () {
            logger.debug(this.id + ".startup");
            this._execute();
        },

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");
            if (this.refreshOnContextChange) {
                this._execute();

                if (this.refreshOnContextUpdate) {
                    if (this._objectChangeHandler !== null) {
                        this.unsubscribe(this._objectChangeHandler);
                    }
                    if (obj) {
                        this._objectChangeHandler = this.subscribe({
                            guid: obj.getGuid(),
                            callback: lang.hitch(this, function () {
                                this._execute();
                            })
                        });
                    }
                }
            }

            this._executeCallback(callback, "update");
        },

        _execute: function () {
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
                _jQuery('.mx-grid-searchbar').each(function () {
                    var searchBar = _jQuery(this);
                    var cookieName = getCookieName(searchBar);
                    var regexp = '(?:(?:^|.*;\\s*)' + cookieName + '\\s*\\=\\s*([^;]*).*$)|^.*$';
                    var cookieValue = document.cookie.replace(new RegExp(regexp), "$1");
                    if (!cookieValue)
                        return;
                    var values = JSON.parse(decodeURIComponent(cookieValue));
                    if (!values)
                        return;
                    searchBar.find('input, textarea').each(function () {
                        if (_jQuery(this).val())
                            return;
                        _jQuery(this).val(values.shift());
                    });
                    searchBar.find('select').each(function () {
                        if (_jQuery(this).val())
                            return;
                        _jQuery(this).val(_jQuery(this).find('option:contains(\'' + values.shift() + '\')').attr('value'));
                    });
                    searchBar.show();
                    if (searchAutomatically) {
                        searchBar.find('.mx-grid-search-button').click();
                    }
                });
                preventSetCookie = false;
            };

            var saveSearch = function (elem) {
                if (preventSetCookie)
                    return;
                var searchBar = getSearchBar(elem);
                var cookieName = getCookieName(searchBar);
                var values = [];
                searchBar.find('input, textarea').each(function () {
                    values.push(_jQuery(this).val());
                });
                searchBar.find('select').each(function () {
                    values.push(_jQuery(this).find('option:selected').text());
                });
                document.cookie = cookieName + '=' + encodeURIComponent(JSON.stringify(values));
            };

            _jQuery(function () {
                // Search button sets a cookie
                _jQuery('.mx-grid-search-button').click(function () {
                    saveSearch(_jQuery(this));
                });
                // Pressing enter sets the cookie, too
                _jQuery('.mx-grid-search-inputs .form-control').keypress(function (event) {
                    if (event.which == 13)
                        saveSearch(_jQuery(this));
                });
                // Reset button clears the cookie
                _jQuery('.mx-grid-reset-button').click(function () {
                    var searchBar = getSearchBar(_jQuery(this));
                    var cookieName = getCookieName(searchBar);
                    document.cookie = cookieName + '=null';
                });
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
