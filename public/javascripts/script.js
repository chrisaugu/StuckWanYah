/*!
 * Copyright © 2018-present, StuckWanYah. All rights reserved.
 * (c) 2018 Christian J.F. Augustyn
 */
/* Movie Sleep Over */
;(function ($, document, window) {
    'use strict';

    var baseURL = 'https://stuckwanyah.herokuapp.com/'
        , DOMAIN_NAME = baseURL
        , apiURL = baseURL.substr( - 1) + '/api/v1/'
        , keyStrokeCount = 0
        , xmlhttp = null
        , photos = []
        , current_page = document.location.pathname;

    $(document).ready(function () {

        $.ajaxSetup({
            cache: true
        });
        $.getScript('/javascripts/sdk.js', function () {
            FB.init({
                appId: '1791165357568831', // 'YOUR-APP-ID-HERE'
                // appSecret: 'APP-SECRET_HERE',
                status: false, // the SDK will attempt to get info about the current user immediately after init
                cookie: false, // enable cookies to allow the server to access
                // the session
                xfbml: false, // With xfbml set to true, the SDK will parse your page's DOM to find and initialize any social plugins that have been added using XFBML
                version: 'v2.8' // use graph api version 2.5 or v2.1, 2.2, 2.3, ...
            });

            $('#loginbutton,#feedbutton').removeAttr('disable');

            function fbLogin() {
                return new Promise(function (resolve, reject) {

                    FB.login(function (result) {
                        if (result.authResponse) {
                            $.post('http://localhost:5000/api/v1/auth/facebook/login', {
                                data: result
                                //access_token: result.authResponse.accessToken
                            }).toPromise().then(function (response) {
                                var token = response.headers.get('x-auth-token');
                                if (token) {
                                    localStorage.setItem('id_token', token);
                                }
                                resolve(response.json());
                            }).catch(function () {
                                reject();
                            })
                        } else {
                            reject();
                        }
                    }, {
                        scope: 'publish_actions, public_profile, email, friends, user_bio user_likes, user_photos, gender, user_friends'
                    })
                });
            };

            function logout() {
                localStorage.removeItem('id_token');
                // FB.logout();
            };
            
            function isLoggedIn() {
                return new Promise(function (resolve, reject) {
                    this.getCurrentUser().then(function (user) {
                        resolve(true)
                    }).catch (function () {
                        reject(false);
                    });
                });
            };

            function getCurrentUser() {
                return new Promise(function (resolve, reject) {
                    $.get('http://localhost:5000/api/v1/auth/me').toPromise().then(function (response) {
                        resolve(response.json());
                    });
                });
            };

            function checkLogin() {
                return new Promise(function (resolve, reject) {
                    this.isLoggedIn().then(function () {
                        resolve(true);
                    }).catch (function () {
                        window.location.href = '/welcome';
                        reject(false);
                    })
                });
            };

            /* updateStatusCallback */
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    console.log('Logged in');
                } else {
                    fbLogin();
                }
            });

            function getFriendsList() {
                return new Promise(function (resolve, reject) {
                    FB.api('/me/friends').then(function (result) {
                        resolve(result.json());
                    }).catch (function (error) {
                        console.error(error);
                        reject(false);
                    })
                });
            }

            $('#loginbutton').click(function (e) {
                fbLogin();
            });

            $('#logoutbutton').click(function (e) {
                logout();
            });

            function postToFacebook(message) {
                return new Promise(function (resolve, reject) {
                    FB.api('/me/feed', 'post', {
                        message: 'Hello, world!'
                    });
                })
            }

            $('#postToFacebook').click(function (e) {
                return new Promise(function (resolve, reject) {
                    FB.ui({
                        method: 'share',
                        action_type: 'og.likes',
                        actions_properties: JSON.stringify({
                            object: 'https://developers.facebook.com/docs/'
                        })
                    }).then(function (response) {
                        console.log(response);
                    }).catch (function (err) {
                        console.error(err);
                        reject(true);
                    });
                });
            });

            function addtab() {
                FB.ui({
                    method: 'pagetab',
                    redirect_uri: 'YOUR_URL'
                }, function (response) {

                })
            }

        });
    });

    var store = (function (setup) {
        var store = localStorage;
        return {
            has: function (key) {
                store.getItem(key);
            },
            get: function (key) {
                store.getItem(key);
            },
            set: function (key, value) {
                store.setItem(key, value);
            }
        }
    })();

    var defaults = {
            init: function() {},
        },
        SITENAME = 'StuckWanYah',
        version = 'v1.0.0';

    /**
     * StuckWanYah JavaScript
     */
    function StuckWanYah(element, options) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = SITENAME;
        this._version = version;

        this.store = store;

        this.init();
    };

    var $this = null;

    StuckWanYah.prototype = {
        init: function () {
            $this = StuckWanYah.prototype;
            this.setDefaultData();
            this.initPageEventListener();
            this.initClickEventListener();
            this.initSubmitEvent();
            this.initShareEvent();
            //this.show_error_messages();
            this.show_top_ranked_photo();
        },
        initClickEventListener: function () {
            $('body').on('click', 'a', function (e) {
                //e.preventDefault();
                //if ($this._search(e.target.href) === '/.html/gi') {
                //$this.registerPageHit($this._fancy(e.target.href.toString()));
                //} else if ($(this).attr('data-action')) {
                //$this.handleAction($(this).attr('data-action'), $(this).attr('data-id') ? $(this).attr('data-id') : null);
                //}
            }).on('focus', 'input', function () {
                //if ($(window).scrollTop() > 0) {
                //    $('html,body').scrollTop($(this).offset().top - 110)
                //}
            }).on('click', 'button, .button', function () {
                if ($(this).attr('data-action')) {
                    //$this.handleAction($(this).attr('data-action'), $(this).attr('data-id') ? $(this).attr('data-id')  : null);
                }
            }).on('keyup', 'form[data-form=\'submit\'] textarea', function (e) {
                var len = $this._clean($(this).val()).length;
                var $counter = $('#counter');
                if (len <= 120) {
                    $counter.html((120 - len) + ' characters remaining');
                }
                if ((120 - len) === 0) {
                    // stop the textarea from accepting the keypress
                    $counter.html('works');
                }
            }).on('change', '#ranking_type_field', function (e) {
                var params = {
                    'field': e.target.value,
                    'gender': $('#ranking_type_gender').val()
                };
                $this.renderRankList(params);
            }).on('change', '#ranking_type_gender', function (e) {
                var params = {
                    'field': $('#ranking_type_field').val(),
                    'gender': e.target.value
                };
                $this.renderRankList(params);
            }).on('click', '#connect_facebook', function () {
                $this.handleAction('facebook_connect', $(this).attr('id'));
            }).on('submit', 'form', function (e) {
                //e.preventDefault(); // No need to do anything else, on click for .button already takes care of things
            })
        },
        initShareEvent: function () {
            $('[data-share-url]').click(function (e) {
                e.preventDefault();
            });
        },
        initSubmitEvent: function () {
            this.validateForm();
            //this.submitForm();
        },
        initPageEventListener: function () {
            var l = this._slice(document.location.pathname);
            switch (l) {
                case '/':
                    $this.registerPageHit('home');
                    break;
                case 'friends':
                    $this.renderFriendsList();
                    $this.registerPageHit('friends');
                    break;
                case 'flames':
                    $this.registerPageHit('flames');
                    break;
                case 'games':
                    $this.registerPageHit('games');
                    break;
                case 'rankings':
                    $this.renderRankList();
                    $this.registerPageHit('rankings');
                    break;
                case 'submit':
                    $this.registerPageHit('submit');
                    break;
            }
        },
        initShareFacebookEvent: function () {
            $('.btn-share-facebook').click(function (e) {
                var url = encodeURIComponent($('.share-url-original').val());
                window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, 'myWindowName', 'width=600, height=600');
                return false;
            });
        },
        onClickShareButton: function (e) {
            e.preventDefault && e.preventDefault();
            var link = this.getAttribute('data-href') || 'https://stuckwanyah.herokuapp.com/';
            window.open('http://www.facebook.com/dialog/share?app_id=362497390470077&href=' +
                encodeURIComponent(link) + '&redirect_uri=' +
                encodeURIComponent('https://stuckwanyah.herokuapp.com/') + '&display=popup', 'StuckWanYah', 'resizable,scrollbars,status,width=500,height=500');
            return false;
        },
        onSubmitButtonClick: function () {
            $('#kval').val(keyStrokeCount);
            var a = new Date() - start;
            $('#loadtime').val(a)
        },
        updateKeyStrokeCount: function () {
            keyStrokeCount = keyStrokeCount + 1
        },
        registerPageHit: function (pageName) {
            $.ajax({
                async: true,
                crossDomain: true,
                url: "/api/v1/hits",
                type: 'PUT',
                data: {
                    page: pageName
                },
            })
        },
        renderTwoPhotos: function () {
            $this.getImages({
                data: {
                    gender: '',
                    age: '13-21',
                    limit: 2,
                }
            }, function (photos) {
                $.each(photos, function (i, photo) {
                    $('#photos [name=contenderId]').eq(i).attr('value', photo.user_id);
                    $('#photos input:image').eq(i).attr('src', photo.image_url);
                    $('#ratings .ratings').eq(i).html(photo.ratings);
                    $('#wins .winings').eq(i).html(photo.wins);
                    $('#wins .losings').eq(i).html(photo.losses);
                    $('#scores .scorings').eq(i).html(photo.scores);
                    $('#expectations .expectations').eq(i).html(photo.expectations);
                });
            });
        },
        renderImages: function () {
            try {
                $this.getImages();
            } catch (e) {
                console.log(e);
            }
        },
        getImages: function () {
            $.ajax({
                url: '/api/v1/photos',
                type: 'GET',
                dataType: 'json',
                data: {
                    gender: $this.getPreferredGender()
                }
            }).done(function (photo) {
                $this.appendImages(photo);
            }).fail(function (err) {
                console.log(err);
            });
        },
        appendImages: function (photo) {
            if (data.data.length < 2) {
                $('#main-display').html('<p>There aren\'t enough players of this gender currently. You could help <a href=\'#submit\'>change that</a>.</p>');
                return;
            }
            var $display = $('#main-display');
            $display.hide();
            // Player 1
            var id = data.data[0].id;
            $('#player-one').attr('src', '/api/v1/photo.php?id=' + id).attr('data-id', id);
            // Player 2
            id = data.data[1].id;
            $('#player-two').attr('src', '/api/v1/photo.php?id=' + id).attr('data-id', id);
            $display.fadeIn(600);
        },
        renderFriendsList: function () {
            try {
                $this.getFriendsList();
            } catch (e) {
                console.log(e);
            }
        },
        getFriendsList: function () {
            try {
                //if (email && api_key) {
                if ($('#photos').is(':empty')) {
                    $.getJSON({
                        url: '/api/v1/photos',
                        //data: {"gender": "female"},
                        success: function (response) {
                            $this.appendFriendsList(response);
                        }
                    });
                } else {
                    // $this.showFriendsList();
                } //}

            } catch (e) {
                console.log(e);
            }
        },
        appendFriendsList: function (response) {
            /*try {
                if (typeof response != "undefined") {
                    if (typeof response.friendslist != "undefined") {
                        $('#photos').empty();
                        var friends_list = response.friendslist;
                        Object.keys(friends_list).forEach(function(siteName) {
                            var siteDetectedApps = (typeof friends_list[siteName] === "object") ? friends_list[siteName] : JSON.parse(following_sites[siteName]);
                            $this.appendAppDetails(siteDetectedApps, siteName, response.days);
                        });
                        $this.showFollowingSites();
                    }
                }
            } catch(e) {
                console.log(e);
            }*/
            try {
                if (typeof response !== 'undefined') {
                    if (typeof response.friendslist !== 'undefined') {
                        $('#photos').empty();
                        var friends_list = response.friendslist;
                        Object.keys(friends_list).forEach(function (siteName) {
                        });
                    }
                }
            } catch (e) {
                console.log(e);
            }

            var output = '';
            output += '<tr>';
            output += '<td class="photos" style="width: 902px;">';
            $.each(response, function (i, item) {
                output += '<a href="' + item.uri + '" data-fb-id="' + item.image_id + '">';
                output += '<img class="photo" src="/photos/' + item.image_url + '" style="width:70px!important">';
                output += '</a>';
            });
            output += '</td>';
            output += '</tr>';
            $('#photos').html(output);
        },
        renderRankList: function () {
            $this.getRankList();
        },
        getRankList: function (rankingField) {
            console.log(rankingField);
            try {
                //if ($('#rankings').is(':empty')) {
                $.getJSON({
                    url: '/api/v1/photos/top',
                    data: rankingField,
                    success: function (response) {
                        $this.appendRankList(response);
                    }
                });
                //} else {
                //$this.
                //}
            } catch (e) {
                console.log(e);
            }
        },
        appendRankList: function (response) {
            try {
                var output = $('');
                //var imgEl = $('<img class=\'photo\' src=\'/photos/' + item.image_url + '\' data-fb-id=\'' + item.image_id + '" width=\'180\'> ');
                $.each(response, function (i, item) {
                    output += '<tr align="center"><td><a href="'+ item.uri +'">';
                    output += '<img class=\'photo\' src=\'/photos/' + item.image_url + '\' data-fb-id="' + item.image_id + '" width=\'180\'>';
                    output += '</a></td><td></td><td>';
                    output += item.ratings;
                    output += '</td><td></td></tr>';
                });
                $('#rankings').append(output);
            } catch (e) {
                console.log(e);
            }
        },
        show_top_ranked_photo: function () {
            try {
                $.getJSON('/api/v1/photos/top', function (data) {
                    var containerEl = $('<div class="container"></div>');
                    var divEl = $('<div class="server-error-img-div"></div>');
                    var imgEl = $('<img style="border:0px;">');
                    var msgEl = $('<div class="server-error-msg"></div>');
                    var refreshEl = $('<input type="button" class="button" onclick="javascript:location.reload()" value="continue">');
                    $(containerEl).append(
                        $(msgEl).append(data[0].name + ' dat wan yah em stuck wan eh! (*^*)'),
                        $(divEl).append(
                            $(imgEl).attr('src', '/photos/' + data[0].image_url)
                        ),
                        $(msgEl).append($(refreshEl))
                    );
                    $('.current-app-info').append($(containerEl));
                });
            } catch (e) {
                throw new Error(e);
            }
        },
        attach: function(nid) {
            //construct endpoint URL with basePath and nid from Drupal.settings (set in template.php)
            var count_url = baseURL + "/count/up/update?nid=" + nid;
            var xhr = new XMLHttpRequest();
            //make http request to endpoint
            xhr.open("GET", count_url, true);
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        console.log(xhr.responseText);
                    } else {
                        console.error(xhr.statusText);
                    }
                }
            };
            xhr.onerror = function (e) {
                console.error(xhr.statusText);
            };
            xhr.send(null);
        },
        setDefaultData: function () {
            $('[name=name]').val($this.getData('c_user_name'));
            $('[name=fb_id]').val($this.getData('c_user_id'));

            /*var stored = $this.getData(key);

            if (stored === undefined) {
                $this.setData(key, value);
                return value;
            } else {
                return stored;
            }*/
        },
        handleAction: function (action, data) {
            switch (action.toLowerCase()) {
                case 'submitx':
                    $('.results').css('background', 'url(data:image/svg+xml;base64,PCEtLSBUaGlzIHZlcnNpb24gb2YgdGhlIHRocm9iYmVyIGlzIGdvb2QgZm9yIHNpemVzIGxlc3MgdGhhbiAyOHgyOGRwLAogICAgIHdoaWNoIGZvbGxvdyB0aGUgc3Ryb2tlIHRoaWNrbmVzcyBjYWxjdWxhdGlvbjogMyAtICgyOCAtIGRpYW1ldGVyKSAvIDE2IC0tPgo8c3ZnIHZlcnNpb249IjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgICAgICAgICAgICAgICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIKICAgICB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiPgogIDwhLS0gMTY9IFJBRElVUyoyICsgU1RST0tFV0lEVEggLS0+CgogIDx0aXRsZT5NYXRlcmlhbCBkZXNpZ24gY2lyY3VsYXIgYWN0aXZpdHkgc3Bpbm5lciB3aXRoIENTUzMgYW5pbWF0aW9uPC90aXRsZT4KICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgogICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKiovCiAgICAgIC8qIFNUWUxFUyBGT1IgVEhFIFNQSU5ORVIgKi8KICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqLwoKICAgICAgLyoKICAgICAgICogQ29uc3RhbnRzOgogICAgICAgKiAgICAgIFJBRElVUyAgICAgID0gNi44NzUKICAgICAgICogICAgICBTVFJPS0VXSURUSCA9IDIuMjUKICAgICAgICogICAgICBBUkNTSVpFICAgICA9IDI3MCBkZWdyZWVzIChhbW91bnQgb2YgY2lyY2xlIHRoZSBhcmMgdGFrZXMgdXApCiAgICAgICAqICAgICAgQVJDVElNRSAgICAgPSAxMzMzbXMgKHRpbWUgaXQgdGFrZXMgdG8gZXhwYW5kIGFuZCBjb250cmFjdCBhcmMpCiAgICAgICAqICAgICAgQVJDU1RBUlRST1QgPSAyMTYgZGVncmVlcyAoaG93IG11Y2ggdGhlIHN0YXJ0IGxvY2F0aW9uIG9mIHRoZSBhcmMKICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCByb3RhdGUgZWFjaCB0aW1lLCAyMTYgZ2l2ZXMgdXMgYQogICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNSBwb2ludGVkIHN0YXIgc2hhcGUgKGl0J3MgMzYwLzUgKiAyKS4KICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZvciBhIDcgcG9pbnRlZCBzdGFyLCB3ZSBtaWdodCBkbwogICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMzYwLzcgKiAzID0gMTU0LjI4NikKICAgICAgICoKICAgICAgICogICAgICBTSFJJTktfVElNRSA9IDQwMG1zCiAgICAgICAqLwoKICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciB7CiAgICAgICAgd2lkdGg6MTZweDsgIC8qIDIqUkFESVVTICsgU1RST0tFV0lEVEggKi8KICAgICAgICBoZWlnaHQ6MTZweDsgLyogMipSQURJVVMgKyBTVFJPS0VXSURUSCAqLwogICAgICB9CiAgICAgIC5xcC1jaXJjdWxhci1sb2FkZXItcGF0aCB7CiAgICAgICAgc3Ryb2tlLWRhc2hhcnJheTogMzIuNDsgIC8qIDIqUkFESVVTKlBJICogQVJDU0laRS8zNjAgKi8KICAgICAgICBzdHJva2UtZGFzaG9mZnNldDogMzIuNDsgLyogMipSQURJVVMqUEkgKiBBUkNTSVpFLzM2MCAqLwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBoaWRlcyB0aGluZ3MgaW5pdGlhbGx5ICovCiAgICAgIH0KCiAgICAgIC8qIFNWRyBlbGVtZW50cyBzZWVtIHRvIGhhdmUgYSBkaWZmZXJlbnQgZGVmYXVsdCBvcmlnaW4gKi8KICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciwgLnFwLWNpcmN1bGFyLWxvYWRlciAqIHsKICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiA1MCUgNTAlOwogICAgICB9CgogICAgICAvKiBSb3RhdGluZyB0aGUgd2hvbGUgdGhpbmcgKi8KICAgICAgQGtleWZyYW1lcyByb3RhdGUgewogICAgICAgIGZyb20ge3RyYW5zZm9ybTogcm90YXRlKDBkZWcpO30KICAgICAgICB0byB7dHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTt9CiAgICAgIH0KICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciB7CiAgICAgICAgYW5pbWF0aW9uLWR1cmF0aW9uOiAxNTY4LjYzbXM7IC8qIDM2MCAqIEFSQ1RJTUUgLyAoQVJDU1RBUlRST1QgKyAoMzYwLUFSQ1NJWkUpKSAqLwogICAgICAgIGFuaW1hdGlvbi1pdGVyYXRpb24tY291bnQ6IGluZmluaXRlOwogICAgICAgIGFuaW1hdGlvbi1uYW1lOiByb3RhdGU7CiAgICAgICAgYW5pbWF0aW9uLXRpbWluZy1mdW5jdGlvbjogbGluZWFyOwogICAgICB9CgogICAgICAvKiBGaWxsaW5nIGFuZCB1bmZpbGxpbmcgdGhlIGFyYyAqLwogICAgICBAa2V5ZnJhbWVzIGZpbGx1bmZpbGwgewogICAgICAgIGZyb20gewogICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDMyLjMgLyogMipSQURJVVMqUEkgKiBBUkNTSVpFLzM2MCAtIDAuMSAqLwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogMC4xIGEgYml0IG9mIGEgbWFnaWMgY29uc3RhbnQgaGVyZSAqLwogICAgICAgIH0KICAgICAgICA1MCUgewogICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDA7CiAgICAgICAgfQogICAgICAgIHRvIHsKICAgICAgICAgIHN0cm9rZS1kYXNob2Zmc2V0OiAtMzEuOSAvKiAtKDIqUkFESVVTKlBJICogQVJDU0laRS8zNjAgLSAwLjUpICovCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogMC41IGEgYml0IG9mIGEgbWFnaWMgY29uc3RhbnQgaGVyZSAqLwogICAgICAgIH0KICAgICAgfQogICAgICBAa2V5ZnJhbWVzIHJvdCB7CiAgICAgICAgZnJvbSB7CiAgICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsKICAgICAgICB9CiAgICAgICAgdG8gewogICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoLTM2MGRlZyk7CiAgICAgICAgfQogICAgICB9CiAgICAgIEBrZXlmcmFtZXMgY29sb3JzIHsKICAgICAgICBmcm9tIHsKICAgICAgICAgIHN0cm9rZTogIzQyODVmNDsKICAgICAgICB9CiAgICAgICAgdG8gewogICAgICAgICAgc3Ryb2tlOiAjNDI4NWY0OwogICAgICAgIH0KICAgICAgfQogICAgICAucXAtY2lyY3VsYXItbG9hZGVyLXBhdGggewogICAgICAgIGFuaW1hdGlvbi1kdXJhdGlvbjogMTMzM21zLCA1MzMybXMsIDUzMzJtczsgLyogQVJDVElNRSwgNCpBUkNUSU1FLCA0KkFSQ1RJTUUgKi8KICAgICAgICBhbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkczsKICAgICAgICBhbmltYXRpb24taXRlcmF0aW9uLWNvdW50OiBpbmZpbml0ZSwgaW5maW5pdGUsIGluZmluaXRlOwogICAgICAgIGFuaW1hdGlvbi1uYW1lOiBmaWxsdW5maWxsLCByb3QsIGNvbG9yczsKICAgICAgICBhbmltYXRpb24tcGxheS1zdGF0ZTogcnVubmluZywgcnVubmluZywgcnVubmluZzsKICAgICAgICBhbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOiBjdWJpYy1iZXppZXIoMC40LCAwLjAsIDAuMiwgMSksIHN0ZXBzKDQpLCBsaW5lYXI7CiAgICAgIH0KCiAgPC9zdHlsZT4KCiAgPCEtLSAyLjI1PSBTVFJPS0VXSURUSCAtLT4KICA8IS0tIDggPSBSQURJVVMgKyBTVFJPS0VXSURUSC8yIC0tPgogIDwhLS0gNi44NzU9IFJBRElVUyAtLT4KICA8IS0tIDEuMTI1PSAgU1RST0tFV0lEVEgvMiAtLT4KICA8ZyBjbGFzcz0icXAtY2lyY3VsYXItbG9hZGVyIj4KICAgIDxwYXRoIGNsYXNzPSJxcC1jaXJjdWxhci1sb2FkZXItcGF0aCIgZmlsbD0ibm9uZSIgCiAgICAgICAgICBkPSJNIDgsMS4xMjUgQSA2Ljg3NSw2Ljg3NSAwIDEgMSAxLjEyNSw4IiBzdHJva2Utd2lkdGg9IjIuMjUiCiAgICAgICAgICBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICA8L2c+Cjwvc3ZnPgo=)').css('padding', '1px 8px');
                    $this.submitForm(action);
                    return true;
                    break;
                case 'connect_facebook':
                    if (!isLoggedIn()) {
                        $.ajax({
                            url: '/api/v1/auth/login',
                            type: 'post',
                            dataType: 'json',
                            data: {
                            }
                        }).done(function (data) {
                        }).fail(function (data) {
                        })
                    }
                    break;
                case 'flamed':
                    flamed();
                    break;
                case 'facebook_connect':
                    facebook_connect();
                    break;
            }
        },
        rate: function (ev) {
            //ev.preventDefualt();
            console.log(ev.target.previousElementSibling.getAttribute('value'));
            //updateTwoRandomPhotos();
            //getTwoRandomPhotos();
        },
        getPreferredGender: function () {
            var gender = $this.getData('gender');
            // If 'gender' doesn't exist, or if existing 'gender' isn't female or male
            if (!store.has('gender') || (gender !== 'f' && gender !== 'm')) {
                gender = 'f';
            }
            store.set('gender', gender);
            return gender;
        },
        getData: function (key) {
            if (localStorage[key] !== undefined) {
                return localStorage[key];
            }
        },
        setData: function (key, value) {
            var dataKey = key,
                dataValue = JSON.stringify(value);
            try {
                localStorage.setItem(dataKey, dataValue);
            } catch (e) {
            }
        },
        setLoginData: function (res) {
            try {
                var email,
                    api_key;
                email = res.email;
                api_key = res.api_key;
                var itemData = {
                    email: email,
                    api_key: api_key
                };
                var data = {
                    'login_session': JSON.stringify(itemData),
                    'following_sites': JSON.stringify(followingSites)
                };
                this.setData(data);
                this.appendNewFollowingSite();
            } catch (e) {
                console.log(e);
            }
        },
        isLoggedIn1: function () {
            try {
                if ($this.isValidUser()) {
                    if (followingSites.indexOf(currentHostName) <= - 1) {
                        followingSites.push(currentHostName);
                        var itemData = {
                            'following_sites': JSON.stringify(followingSites)
                        };
                        $this.setData(itemData);
                        $this.followSite();
                    } else {
                        $this.getFollowingSites();
                    }
                } else {
                    $this.showSignInForm();
                }
            } catch (e) {
            }
        },
        isLoggedIn: function () {
            // TODO: Fix synchronous AJAX request, use async method instead
            var loggedIn = false;
            $.ajax({
                url: '/api/v1/auth',
                type: 'post',
                dataType: 'json',
                async: false
            }).done(function (data) {
                loggedIn = data.data.logged_in;
            }).fail(function (data) {
                loggedIn = false;
            });
            return loggedIn;
        },
        isValidUser: function () {
            try {
                return (email && api_key && email.trim().length > 0 && api_key.trim().length > 0);
            } catch (e) {
            }
            return false;
        },
        isAuthenticated: function () {
            if ($this.getItem('c_user_name') === '' || !$this.getItem('c_user_name')) {
                return true;
            }
            return true;
        }, // if(firstName && gender && isValidPhoto($("#submit_photo").val())){
        isValidPhoto: function (filename) {
            var extension = filename.replace(/^.*\./, ''); // Replace until we're left with the file extension
            if (filename == extension) {
                extension = ''; // File has no extension, so it's blank
            }
            else {
                extension = extension.toLowerCase();
            }
            switch (extension) {
                case 'gif':
                case 'jpg':
                case 'png':
                    return true;
                default:
                    return false;
            }
        },
        validateForm: function (e) {
            var m = $('textarea');
            typeof m.val() ? m.val()  : null;
            if (m.val() == null) {
                $('.results').html('Cannot send empty values');
                m.focus();
            }
            var options = {
                beforeSubmit: showRequest, // pre-submit callback
                success: showResponse // post-submit callback
            };
            // bind to the form's submit event
            //e.submit(function () {
            //$(this).ajaxSubmit(options); // always return false to prevent standard browser submit and page navigation
            //return false;
            //});
            // pre-submit callback
            function showRequest(formData, jqForm, options) {
                alert('Sending message to ' + formData);
                return true;
            } // post-submit callback

            function showResponse(responseText, statusText, xhr, $form) {
                alert('status: ' + statusText + '\n\nresponseText: \n' + responseText);
            }
        },
        submitForm: function (e) {
            var data = $(this).serialize(); // var form = $(this).parents('form');
            var method = $(this).attr('method');
            var url = DOMAIN_NAME + $(this).attr('url');
            var formData = {
                data: data,
                method: method,
                url: url
            };
            var $this = $(this);
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: '/api/v1/submit',
                    type: 'POST',
                    data: data /*{
                        name: $('[name=name]'),
                        id: $('[name=fb_id]'),
                        message: $('[name=message]')
                    }*/
                }, function (response) {
                    if (response.status != 200) {
                        $('.results').html('Failed to submit form, please try again later.');
                        reject(false);
                    } else {
                        if (typeof response.api_key != 'undefined') $this.setLoginData(response);
                        //$('.results').html('Sent successfully'); resolve(true);
                    }
                });
            });
        },
        showFbLoginButton: function () {
            if (!$this.isLoggedIn()) {
                $('<div id="#loginbutton"></div>')
            } else if ($this.isLoggedIn()) {
                $('<div id="#logoutbutton"></div>');
            }
        },
        show_error_messages: function () {
            var msgArr = [
                {
                    'message': 'What runs WhatRuns is going through a server maintenance 💁&zwj;♀️ &nbsp; &#x1f6a7; Can you try again in a minute or two?',
                    'icon': '2.png'
                },
                {
                    'message': 'We believe you are addicted to WhatRuns 🤒  &nbsp;We care about your health and we want to give you a few hours of break. Please check back later. (Seriously? Server upgrade).',
                    'icon': '3.png'
                },
                {
                    'message': 'Give it a rest! 😾 <br> Just joking. Our bad. We’re updating services that is required to keep this supercool extension running.',
                    'icon': '1.png'
                }
            ];
            var containerEl = $('<div class="container current-app-info active"></div>');
            var divEl = $('<div class="server-error-img-div"></div>');
            var imgEl = $('<img src="/images/2.png" style="border:0px;">');
            var msgEl = $('<div class="server-error-msg"></div>');

            for (var i = 0; i < msgArr.length; i++) {
                $(containerEl).append(
                    $(divEl).append(
                        $(imgEl).attr('src', '/images/' + msgArr[i].icon)
                    ),
                    $(msgEl).append(msgArr[i].message)
                );
            }
            $('.current-app-info').append($(containerEl));
        },
        randomizePhotos: function (array) {
            /* round the product of random number and photos length and add 1 */
            var rand = (Math.floor(Math.random() * array.length) + 1);
            /* check if rand is not exceeding photo lengths and below 0 */
            if (rand < 0) {
                if (rand >= array.length) {
                    return (rand / 2);
                }
                random_item();
            }
            return rand;
        },
        random: function (a) {
            return a[Math.floor(Math.random() * a.length + 1)];
        },
        _random: function (b) {
            return Math.floor(Math.random() * b + 1);
        },
        _slice: function (b) {
            return b.toString().slice(1, - 5);
        },
        _trim: function (s) {
            if (!s || s == '') return '';
            while ((s.charAt(0) == ' ') || (s.charAt(0) == '\n') || (s.charAt(0, 1) == '\r')) s = s.substring(1, s.length);
            while ((s.charAt(s.length - 1) == ' ') || (s.charAt(s.length - 1) == '\n') || (s.charAt(s.length - 1) == '\r')) s = s.substring(0, s.length - 1);
            return s;
        },
        _search: function (string, query) {
            return string.search(/.html/gi);
        },
        _isMatch: function (string, query) {
            var regx1 = /str1/gi;
            var regx2 = /str2/gi;
            if (string.match(regx2)) {
            }
        },
        _clean: function (string) {
            return string.trim().replace(/\s+/g, ' '); // Remove leading/trailing whitespaces and multiple whitespaces
        },
        _fancy: function (string) {
            return $this._clean(string).replace(/\\/g, '');
        },
        dummy: function (text, callback) {
            callback(text);
            //text.map(callback);
        },
        getByID: function (id) {
            return document.getElementById(id);
        },
        getByClass: function (className) {
            return document.getElementsByClassName(className);
        },
        hasImageExntesion: function(email) {
            try {
                return (/\.(gif|jpg|jpeg|tiff|png)$/i).test(email)
            } catch (e) {
                console.log(e);
            }
            return false;
        },
        postData: function(type, url, data, callback) {
            $.ajax({
                type: type,
                url: url,
                data: data,
                success: callback,
            });
        },
        postFormData: function(url, data, callback) {
            $.ajax({
                async: true,
                crossDomain: true,
                url: url,
                type: 'POST',
                data: data,
                success: callback
            })
        }
    };

    /*$.fn[SITENAME] = function (options) {
        var args = arguments;

        // Is the first parameter an object (options), or was omited, instantiate a new instance
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                // Only allow the plugin to be instantiated once due to methods
                if (!$.data(this, 'plugin_' + SITENAME)) {

                    // if it has no instance, create a new one, pass options to our plugin constructor,
                    // and store the plugin instance in the element jQuery data object.
                    $.data(this, 'plugin_' + SITENAME, new StuckWanYah( this, options ));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            // Cache the method call to make it possible to return a value
            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + SITENAME);

                // Tests that there's already a plugin-instance and checks that the requested public method exits
                if (instance instanceof StuckWanYah && typeof instance[options] === 'function') {

                    // Call the method of our plugin instance, and pass it the supplied arguments.
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }
            });

            // If the earlier cached method gives a value back return the value, otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    }
    */
    var stuckwanyah = new StuckWanYah(this, 'init');

    function ajax(callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4)
                callback(xhr.responseText);
        };
        xhr.open("GET", "jsonview.css", true);
        xhr.send(null);
    };

    function ajaxRequest(data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && this.status === 200) {
                callback(xhr.responseText);
            }
        };
        xhr.open(data.method, data.url, !data.async); // "GET" || "POST"
        xhr.setRequestHeader('Content-type', !data.header);
        xhr.send(data.param ? 'x=' + data.param : null);
    };

    function change_myselect() {
        var obj,
            param;
        obj = {
            async: true,
            method: 'post',
            url: '/api/v1/photos/top',
            header: 'application/x-www-formurlencoded',
            data: {
                'field': $('.ranking_type_field'),
                'gender': $('.ranking_type_gender')
            }
        };
        param = JSON.stringify(obj);

        ajaxRequest(param, function () {
            if (this.readyState === 4 && this.status === 200) {
                var myObj,
                    txt,
                    x,
                    txt;
                myObj = JSON.parse(this.responseText);
                txt += '<table border=\'1\'>';
                for (x in myObj) {
                    txt += '<tr><td>' + myObj[x].name + '</td></tr>';
                }
                txt += '</table>';
                document.getElementById('demo').innerHTML = txt;
            }
        });
    };

    StuckWanYah.prototype.storeCurrentUser = function (userId, ratings) {
        window.localStorage.currentUser = JSON.stringify(response.data.user);
        var currentUser = JSON.parse(window.localStorage.currentUser);
        var my_ratings = {
            'image_id': ratings.image_id,
            'image_url': ratings.image_url
        };
        localStorage.setItem('c_user', userId);
        localStorage.setItem('ratings', my_ratings);
    };

    function RequestGraphApi() {
        var settings = {
            'async': true,
            'crossDomain': true,
            'url': 'https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN',
            'method': 'POST',
            'headers': {
                'content-type': 'application/json'
            },
            'processData': false,
            'data': '{\n\t"setting_type": "call_to_actions",\n\t"thread_state": "new_thread",\n\t"call_to_actions": [\n\t\t{\n\t\t\t"payload": "GET_STARTED"\n\t\t}\n\t]\n}'
        };
        $.ajax(settings).done(function (response) {
            console.log(response);
        });
    }

    function RequestGraphApi2() {
        var data = JSON.stringify({
            'setting_type': 'call_to_actions',
            'thread_state': 'new_thread',
            'call_to_actions': [
                {
                    'payload': 'GET_STARTED'
                }
            ]
        });
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.addEventListener('readystatechange', function () {
            if (this.readyState === 4) {
                console.log(this.responseText);
            }
        });
        xhr.open('POST', 'https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN');
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.send(data);
    }

    StuckWanYah.prototype.isBigEnough = function (age) {
        var min = 13,
            max = 21;
        if (age >= min && age <= max) {
            return true;
        }
        return false;
    };

    StuckWanYah.prototype.createDiv = function (id, className, child) {
        var div = document.createElement('div');
        div.id = id;
        div.className = className;
        div.append(child);
        return div;
    };

    StuckWanYah.prototype.createImage = function (id, className, src, width, height) {
        var img = document.createElement('img');
        img.id = id;
        img.className = className;
        img.src = '/photos/' + src.slice(1, - 4) + '.jpg';
        img.width = typeof width == null ? '' : width;
        img.height = typeof height == null ? '' : height;
        return img;
    };

    /*
    document.getElementsByClassName('code') [0].addEventListener('click', function (e) {
        var range = document.createRange();
        range.selectNode(document.getElementsByClassName(e.target.className));
        window.getSelection().addRange(range);
    });
    var buttons = document.getElementsByClassName('custom-fb-share');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].onmouseup = onClickShareButton;
    }*/

}(jQuery, document, window));

function sh(pageName) {
    $.ajax({
        async: true,
        crossDomain: true,
        type: 'PUT',
        url: '/api/v1/hits',
        data: { page: pageName }
    });
}

function rank() {
    var list, i, switching, b, shouldSwitch, ranking = 0;
    list = $('#rankings');
    switching = true;
    while (switching) {
        switching = false;
        b = list.find('tr');
        for (i = 0; i < (b.length - 1); i++) {
            shouldSwitch = false;
            if (b[i].childNodes[1].innerText > b[i + 1].childNodes[1].innerText) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            b[i].parentNode.insertBefore(b[i + 1], b[i]);
            // b[i].childNodes[2].innerText = ranking++;
            switching = true;
        }
    }
}

function stuckwanify() {
    var a = [
        ],
        i,
        n = this,
        max;
    for (i = 0; i < n.length; i++) {
        max = a[0];
        for (i = 0; i < n.length; i++) {
            if (a[i] > max) {
                max = a[i];
            }
        }
    }
    console.log(max);
}

function sortList() {
    var list,
        i,
        switching,
        b,
        shouldSwitch;
    list = document.getElementById('rankings');
    switching = true;
    /* Make a loop that will continue until no switching has been done: */
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        b = list.getElementsByTagName('tr');
        // Loop through all list items:
        for (i = 0; i < (b.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Check if the next item should switch place with the current item: */
            if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
                /* If next item is alphabetically lower than current item,
                        mark as a switch and break the loop: */
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch and mark the switch as done: */
            b[i].parentNode.insertBefore(b[i + 1], b[i]);
            switching = true;
        }
    }
}

function sortListDir() {
    var list, i, switching, b, shouldSwitch, dir, switchcount = 0;
    list = document.getElementById('id01');
    switching = true;
    // Set the sorting direction to ascending:
    dir = 'asc';
    // Make a loop that will continue until no switching has been done:
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        b = list.getElementsByTagName('LI');
        // Loop through all list-items:
        for (i = 0; i < (b.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Check if the next item should switch place with the current item,
                based on the sorting direction (asc or desc): */
            if (dir == 'asc') {
                if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
                    /* If next item is alphabetically lower than current item,
                        mark as a switch and break the loop: */
                    shouldSwitch = true;
                    break;
                }
            } else if (dir == 'desc') {
                if (b[i].innerHTML.toLowerCase() < b[i + 1].innerHTML.toLowerCase()) {
                    /* If next item is alphabetically higher than current item,
                        mark as a switch and break the loop: */
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
                and mark that a switch has been done: */
            b[i].parentNode.insertBefore(b[i + 1], b[i]);
            switching = true;
            // Each time a switch is done, increase switchcount by 1:
            switchcount++;
        } else {
            /* If no switching has been done AND the direction is "asc",
                set the direction to "desc" and run the while loop again. */
            if (switchcount == 0 && dir == 'asc') {
                dir = 'desc';
                switching = true;
            }
        }
    }
}
/**
 * JavaScript Game
 */

var Player = function (game) {
    this.game = game;
    this.x = 100;
    this.y = 100;
};
Player.prototype.update = function () {
    this.x += 1;
    this.y += 1;
};
Player.prototype.draw = function () {
    this.game.drawRectangle('#f00', this.x, this.y, 10, 10);
};
var Game = function () {
    this.fps = 60;
    var canvas = document.getElementById('world');
    this.context = canvas.getContext('2d');
    this.context_width = canvas.width;
    this.context_height = canvas.height;
    this.player = new Player(this);
    var game = this;
    var gameloop = setInterval(function () {
        game.updateAll();
        game.drawAll();
    }, 1000 / this.fps);
};
Game.prototype.updateAll = function () {
    this.player.update();
};
Game.prototype.drawAll = function () {
    this.drawRectangle('#ffffff', 0, 0, this.context_width, this.context_height);
    this.player.draw();
};
Game.prototype.drawRectangle = function (color, x, y, width, height) {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, width, height);
};

/*
function saveCredentials() {
    localStorage["appId"] = document.getElementById("app_id").value;
    localStorage["accessToken"] = document.getElementById("access_token").value;
    document.getElementById("msg").innerHTML = "Successfully change!";
    setTimeout(function(){document.getElementById("msg").innerHTML = '';}, 1500);
}

function eraseCredentials() {
    localStorage.removeItem("appId");
    localStorage.removeItem("accessToken");
    location.reload();
}

function saveOptions() {
    localStorage["mobileNumber"] = $('#mobile_number').val();
    localStorage["message"] = $('#message').val();
    $("#msgOptions").text("Successfully change!");
    setTimeout(function(){$("#msgOptions").text('');}, 1500);
}

function eraseOptions() {
    localStorage.removeItem("mobileNumber");
    localStorage.removeItem("message");
    $("#msgOptions").text("Successfully clear!");
    setTimeout(function(){$("#msgOptions").text('');}, 1500);
    $("#mobile_number").val('');
    $("#message").val('');
}

window.onload = function () {

    if (localStorage['message'] == undefined)
        localStorage['message'] = "Hi, check this out:";

    $("#app_id").val(localStorage["appId"] == undefined ? "" : localStorage["appId"]);
    $("#access_token").val(localStorage["accessToken"] == undefined ? "" : localStorage["accessToken"]);
    $("#mobile_number").val(localStorage["mobileNumber"] == undefined ? "" : localStorage["mobileNumber"]);
    $("#message").val(localStorage["message"] == undefined ? "" : localStorage["message"]);

    document.querySelector('input[value="Save"]').onclick=saveCredentials;
    document.querySelector('input[value="Clear"]').onclick=eraseCredentials;

    document.querySelector('input[id="save2"]').onclick=saveOptions;
    document.querySelector('input[id="clear2"]').onclick=eraseOptions;

    var content = $(".menuitem");

    var swapContents= function(target) {
        // swap the content
        var currentSelected = $(target).parent().siblings("#content").children(".contentitem.selected");
        currentSelected.removeClass("selected");

        var selectedContent = $("#" + target.id + "-content");
        selectedContent.addClass("selected");

        // swap the menu
        var currentSelectedMenu = $(target).parent().children(".menuitem.selected");
        currentSelectedMenu.removeClass("selected");

        $(target).css("background-color", "");
        $(target).addClass("selected");
    }

    content.hover(
        function () {
            if (!$(this).hasClass("selected"))
                $(this).css("background-color", "#E4FFE1");
        },
        function () {
            if (!$(this).hasClass("selected"))
                $(this).css("background-color", "#DADEE0");
        });

    content.click(function() {
        swapContents(this);
    });
}*/