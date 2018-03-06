/* Copyright © 2018 StuckWanYah by Christian J.F. Augustyn */
/* Movie Sleep Over */
(function ($) {
    'use strict';
    /*$(document).ready(function () {
        $.ajaxSetup({
            cache: true
        });
        $.getScript('/javascripts/sdk.js', function () {
            FB.init({
                appId		: '1791165357568831', // 'YOUR-APP-ID-HERE'
                appSecret	: 'APP-SECRET_HERE',
                status		: false, // the SDK will attempt to get info about the current user immediately after init
                cookie		: false,  // enable cookies to allow the server to access
                // the session
                xfbml		: false,  // With xfbml set to true, the SDK will parse your page's DOM to find and initialize any social plugins that have been added using XFBML
                version		: 'v2.8' // use graph api version 2.5 or v2.1, 2.2, 2.3, ...
            });

            $('#loginbutton,#feedbutton').removeAttr('disable');

            function userSerivce() {

                function fbLogin(){
                    return new Promise(function(resolve, reject){
                        FB.login(function(result){
                            if (result.authResponse) {
                                return $.post('http://localhost:5000/api/v1/auth/facebook', {
                                    access_token: result.authResponse.accessToken
                                }).toPromise().then(function(response){
                                    var token = response.headers.get('x-auth-token');
                                    if (token) {
                                        localStorage.setItem('id_token', token);
                                    }
                                    resolve(response.json());
                                }).catch(function(){
                                    reject();
                                })
                            } else {
                                reject();
                            }
                        }, {scope: 'publish_actions, public_profile, email, friends, user_likes, user_photos, gender'})
                    });
                }

                function logout(){
                    localStorage.removeItem('id_token');
                    // FB.logout();
                }

                function isLoggedIn(){
                    return new Promise(function(resolve, reject){
                        this.getCurrentUser().then(function(user){
                            resolve(true)
                        }).catch(function(){
                            reject(false);
                        });
                    })
                }

                function getCurrentUser() {
                    return new Promise(function(resolve, reject){
                        $.get('http://localhost:5000/api/v1/auth/me').toPromise().then(function(response){
                            resolve(response.json());
                        })
                    })
                }
            }

            function canActivate(){
                return this.checkLogin();
            }

            function checkLogin(){
                return new Promise(function(resolve, reject){
                    this.userService().isLoggedIn().then(function(){
                        resolve(true);
                    }).catch(function(){
                        window.location.href = '/welcome';
                        reject(false);
                    })
                });
            };

            /* updateStatusCallback *
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    console.log('Logged in');
                } else {
                    this.userSerivce().fbLogin();
                }
            });

            function getFriendsList() {
                return new Promise(function (resolve, reject) {
                    FB.api('/me/friends').then(function (result) {

                        resolve(result.json());
                    }).catch(function (error) {
                        console.error(error);
                        reject(false);
                    })
                });
            }

            function postToFacebook(message){
                return new Promise(function(resolve, reject){
                    FB.api('/me/feed', 'post', {
                        message: 'Hello, world!'
                    });
                })
            }

            $('#loginbutton').click(function (e) {
                return new Promise(function(resolve, reject){
                    this.userSerivce().fbLogin();
                });
            });

            $('#logoutbutton').click(function (e) {
                return new Promise(function(resolve, reject){
                    this.logout();
                });
            });

            $('#postToFacebook').click(function (e) {
                return new Promise(function(resolve, reject){
                    FB.ui({
                        method: 'share',
                        action_type: 'og.likes',
                        actions_properties: JSON.stringify({
                            object: 'https://developers.facebook.com/docs/'
                        })
                    }).then(function (response) {
                        console.log(response);
                    }).catch(function(err){
                        console.error(err);
                        reject(true);
                    });
                });
            });
        });
    });
    */

    /**
     * StuckWanYah Script
     */
    var baseURL = 'https://stuckwanyah.herokuapp.com/',
        apiURL = baseURL.substr( - 1) + '/api/v1/',
        keyStrokeCount = 0,
        xmlhttp = null,
        photos = [
        ],
        current_page = document.location.pathname;
    var StuckWanYah = function () {
        this.init();
    };
    StuckWanYah.prototype = {
        self: '',
        version: 'v1.0.0',
        init: function () {
            self = StuckWanYah.prototype || this;
            this.setGlobalItems();
            this.initShareEvent();
            this.initPageEventListener();
            this.initClickEventListener();
            this.initSubmitEvent();
        },
        setGlobalItems: function () {
            self.setDefaultData();
        },
        initClickEventListener: function () {
            $('body').on('click', 'a', function (e) {
                //e.preventDefault();
                if (self._search(e.target.href) === '/.html/gi') {
                    self.registerPageHit(self._fancy(e.target.href.toString()));
                } else if ($(this).attr('data-action')) {
                    self.handleAction($(this).attr('data-action'), $(this).attr('data-id') ? $(this).attr('data-id') : null);
                }
            }).on('focus', 'input', function () {
                if ($(window).scrollTop() > 0) {
                    $('html,body').scrollTop($(this).offset().top - 110)
                }
            }).on('click', 'button, .button', function () {
                if ($(this).attr('data-action')) {
                    //self.handleAction($(this).attr('data-action'), $(this).attr('data-id') ? $(this).attr('data-id')  : null);
                }
            }).on('keyup', 'form[data-form=\'submit\'] textarea', function (e) {
                var len = self._clean($(this).val()).length;
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
                self.renderRankList(params);
            }).on('change', '#ranking_type_gender', function (e) {
                var params = {
                    'field': $('#ranking_type_field').val(),
                    'gender': e.target.value
                };
                self.renderRankList(params);
            }).on('click', '#connect_facebook', function () {
                self.handleAction('facebook_connect', $(this).attr('id'));
            }).on('submit', 'form', function (e) {
                e.preventDefault(); // No need to do anything else, on click for .button already takes care of things
            })
        },
        initShareEvent: function () {
            $('[data-share-url]').click(function (e) {
                e.preventDefault();
            });
        },
        initSubmitEvent: function () {
            //document.getElementsByTagName('form') [0].addEventListender('submit', function () {});
        },
        initPageEventListener: function () {
            var l = this._slice(document.location.pathname);
            switch (l) {
                case '/':
                    self.registerPageHit('home');
                    break;
                case 'friends':
                    self.renderFriendsList();
                    self.registerPageHit('friends');
                    break;
                case 'flames':
                    self.registerPageHit('flames');
                    break;
                case 'games':
                    self.registerPageHit('games');
                    break;
                case 'rankings':
                    self.renderRankList();
                    self.registerPageHit('rankings');
                    break;
                case 'submit':
                    self.registerPageHit('submit');
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
                type: 'put',
                url: '/api/v1/hits',
                data: {
                    page: pageName
                }
            });
        },
        renderTwoPhotos: function () {
            self.getImages({
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
            $.ajax({
                url: '/api/v1/photos',
                type: 'GET',
                dataType: 'json',
                data: {
                    gender: self.getPreferredGender()
                }
            }).done(function (photo) {
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
            }).fail(function (err) {
            })
        },
        renderFriendsList1: function () {
            this.getFriendsList({
            }, function (data) {
            });
        },
        renderFriendsList: function () {
            $.getJSON('/api/v1/photos/all', function (data) {
                    var output = '';
                    output += '<tr>';
                    output += '<td class="photos" style="width: 902px;">';
                    $.each(data, function (i, item) {
                        output += '<a href="' + item.uri + '" data-fb-id="' + item.image_id + '">';
                        output += '<img class="photo" src="/photos/' + item.image_url + '" style="width:70px!important">';
                        output += '</a>';
                    });
                    output += '</td>';
                    output += '</tr>';
                    $('#photos').html(output);
            }
            )
        },
        renderRankList1: function () {
            this.getRankList({
            }, function (data) {
            });
        },
        renderRankList: function (rankingField) {
            console.log(rankingField);
            $.getJSON({
                    'url': '/api/v1/photos/top',
                    'data': rankingField ? rankingField : null
            }, function (data) {
                    var output = '';
                    $.each(data, function (i, item) {
                        output += '<tr>';
                        output += '<td>';
                        output += '<img class=\'photo\' src=\'/photos/' + item.image_url + '\' data-fb-id="' + item.image_id + '" width=\'180\'>';
                        output += '</td>';
                        output += '<td>';
                        output += '</td>';
                        output += '<td>';
                        output += item.ratings;
                        output += '</td>';
                        output += '<td>';
                        output += '</td>';
                        output += '<td>';
                        output += item.rankings;
                        output += '</td>';
                        output += '</tr>';
                    });
                    $('#rankings').html(output);
            }
            )
        },
        getPreferredGender: function () {
            var gender = store.get('gender');
            // If 'gender' doesn't exist, or if existing 'gender' isn't female or male
            if (!store.has('gender') || (gender !== 'f' && gender !== 'm')) {
                gender = 'f';
            }
            store.set('gender', gender);
            return gender;
        },
        getData: function (key) {
            return localStorage.getItem(key);
        },
        setData: function (key, value) {
            return localStorage.setItem(key, JSON.stringify(value));
        },
        setDataToLocalStorage: function (data) {
            var key = data.key,
                value = data.value;
            try {
                localStorage.setItem(key, value);
            } catch (e) {
            }
        },
        setDefaultData: function () {
            $('[name=name]').val(self.getData('c_user_name'));
            $('[name=fb_id]').val(self.getData('c_user_id'));
        },
        handleAction: function (action, data) {
            switch (action.toLowerCase()) {
                case 'submitx':
                    $('.results').css('background', 'url(data:image/svg+xml;base64,PCEtLSBUaGlzIHZlcnNpb24gb2YgdGhlIHRocm9iYmVyIGlzIGdvb2QgZm9yIHNpemVzIGxlc3MgdGhhbiAyOHgyOGRwLAogICAgIHdoaWNoIGZvbGxvdyB0aGUgc3Ryb2tlIHRoaWNrbmVzcyBjYWxjdWxhdGlvbjogMyAtICgyOCAtIGRpYW1ldGVyKSAvIDE2IC0tPgo8c3ZnIHZlcnNpb249IjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgICAgICAgICAgICAgICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIKICAgICB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiPgogIDwhLS0gMTY9IFJBRElVUyoyICsgU1RST0tFV0lEVEggLS0+CgogIDx0aXRsZT5NYXRlcmlhbCBkZXNpZ24gY2lyY3VsYXIgYWN0aXZpdHkgc3Bpbm5lciB3aXRoIENTUzMgYW5pbWF0aW9uPC90aXRsZT4KICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgogICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKiovCiAgICAgIC8qIFNUWUxFUyBGT1IgVEhFIFNQSU5ORVIgKi8KICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqLwoKICAgICAgLyoKICAgICAgICogQ29uc3RhbnRzOgogICAgICAgKiAgICAgIFJBRElVUyAgICAgID0gNi44NzUKICAgICAgICogICAgICBTVFJPS0VXSURUSCA9IDIuMjUKICAgICAgICogICAgICBBUkNTSVpFICAgICA9IDI3MCBkZWdyZWVzIChhbW91bnQgb2YgY2lyY2xlIHRoZSBhcmMgdGFrZXMgdXApCiAgICAgICAqICAgICAgQVJDVElNRSAgICAgPSAxMzMzbXMgKHRpbWUgaXQgdGFrZXMgdG8gZXhwYW5kIGFuZCBjb250cmFjdCBhcmMpCiAgICAgICAqICAgICAgQVJDU1RBUlRST1QgPSAyMTYgZGVncmVlcyAoaG93IG11Y2ggdGhlIHN0YXJ0IGxvY2F0aW9uIG9mIHRoZSBhcmMKICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCByb3RhdGUgZWFjaCB0aW1lLCAyMTYgZ2l2ZXMgdXMgYQogICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNSBwb2ludGVkIHN0YXIgc2hhcGUgKGl0J3MgMzYwLzUgKiAyKS4KICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZvciBhIDcgcG9pbnRlZCBzdGFyLCB3ZSBtaWdodCBkbwogICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMzYwLzcgKiAzID0gMTU0LjI4NikKICAgICAgICoKICAgICAgICogICAgICBTSFJJTktfVElNRSA9IDQwMG1zCiAgICAgICAqLwoKICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciB7CiAgICAgICAgd2lkdGg6MTZweDsgIC8qIDIqUkFESVVTICsgU1RST0tFV0lEVEggKi8KICAgICAgICBoZWlnaHQ6MTZweDsgLyogMipSQURJVVMgKyBTVFJPS0VXSURUSCAqLwogICAgICB9CiAgICAgIC5xcC1jaXJjdWxhci1sb2FkZXItcGF0aCB7CiAgICAgICAgc3Ryb2tlLWRhc2hhcnJheTogMzIuNDsgIC8qIDIqUkFESVVTKlBJICogQVJDU0laRS8zNjAgKi8KICAgICAgICBzdHJva2UtZGFzaG9mZnNldDogMzIuNDsgLyogMipSQURJVVMqUEkgKiBBUkNTSVpFLzM2MCAqLwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBoaWRlcyB0aGluZ3MgaW5pdGlhbGx5ICovCiAgICAgIH0KCiAgICAgIC8qIFNWRyBlbGVtZW50cyBzZWVtIHRvIGhhdmUgYSBkaWZmZXJlbnQgZGVmYXVsdCBvcmlnaW4gKi8KICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciwgLnFwLWNpcmN1bGFyLWxvYWRlciAqIHsKICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiA1MCUgNTAlOwogICAgICB9CgogICAgICAvKiBSb3RhdGluZyB0aGUgd2hvbGUgdGhpbmcgKi8KICAgICAgQGtleWZyYW1lcyByb3RhdGUgewogICAgICAgIGZyb20ge3RyYW5zZm9ybTogcm90YXRlKDBkZWcpO30KICAgICAgICB0byB7dHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTt9CiAgICAgIH0KICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciB7CiAgICAgICAgYW5pbWF0aW9uLWR1cmF0aW9uOiAxNTY4LjYzbXM7IC8qIDM2MCAqIEFSQ1RJTUUgLyAoQVJDU1RBUlRST1QgKyAoMzYwLUFSQ1NJWkUpKSAqLwogICAgICAgIGFuaW1hdGlvbi1pdGVyYXRpb24tY291bnQ6IGluZmluaXRlOwogICAgICAgIGFuaW1hdGlvbi1uYW1lOiByb3RhdGU7CiAgICAgICAgYW5pbWF0aW9uLXRpbWluZy1mdW5jdGlvbjogbGluZWFyOwogICAgICB9CgogICAgICAvKiBGaWxsaW5nIGFuZCB1bmZpbGxpbmcgdGhlIGFyYyAqLwogICAgICBAa2V5ZnJhbWVzIGZpbGx1bmZpbGwgewogICAgICAgIGZyb20gewogICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDMyLjMgLyogMipSQURJVVMqUEkgKiBBUkNTSVpFLzM2MCAtIDAuMSAqLwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogMC4xIGEgYml0IG9mIGEgbWFnaWMgY29uc3RhbnQgaGVyZSAqLwogICAgICAgIH0KICAgICAgICA1MCUgewogICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDA7CiAgICAgICAgfQogICAgICAgIHRvIHsKICAgICAgICAgIHN0cm9rZS1kYXNob2Zmc2V0OiAtMzEuOSAvKiAtKDIqUkFESVVTKlBJICogQVJDU0laRS8zNjAgLSAwLjUpICovCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogMC41IGEgYml0IG9mIGEgbWFnaWMgY29uc3RhbnQgaGVyZSAqLwogICAgICAgIH0KICAgICAgfQogICAgICBAa2V5ZnJhbWVzIHJvdCB7CiAgICAgICAgZnJvbSB7CiAgICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsKICAgICAgICB9CiAgICAgICAgdG8gewogICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoLTM2MGRlZyk7CiAgICAgICAgfQogICAgICB9CiAgICAgIEBrZXlmcmFtZXMgY29sb3JzIHsKICAgICAgICBmcm9tIHsKICAgICAgICAgIHN0cm9rZTogIzQyODVmNDsKICAgICAgICB9CiAgICAgICAgdG8gewogICAgICAgICAgc3Ryb2tlOiAjNDI4NWY0OwogICAgICAgIH0KICAgICAgfQogICAgICAucXAtY2lyY3VsYXItbG9hZGVyLXBhdGggewogICAgICAgIGFuaW1hdGlvbi1kdXJhdGlvbjogMTMzM21zLCA1MzMybXMsIDUzMzJtczsgLyogQVJDVElNRSwgNCpBUkNUSU1FLCA0KkFSQ1RJTUUgKi8KICAgICAgICBhbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkczsKICAgICAgICBhbmltYXRpb24taXRlcmF0aW9uLWNvdW50OiBpbmZpbml0ZSwgaW5maW5pdGUsIGluZmluaXRlOwogICAgICAgIGFuaW1hdGlvbi1uYW1lOiBmaWxsdW5maWxsLCByb3QsIGNvbG9yczsKICAgICAgICBhbmltYXRpb24tcGxheS1zdGF0ZTogcnVubmluZywgcnVubmluZywgcnVubmluZzsKICAgICAgICBhbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOiBjdWJpYy1iZXppZXIoMC40LCAwLjAsIDAuMiwgMSksIHN0ZXBzKDQpLCBsaW5lYXI7CiAgICAgIH0KCiAgPC9zdHlsZT4KCiAgPCEtLSAyLjI1PSBTVFJPS0VXSURUSCAtLT4KICA8IS0tIDggPSBSQURJVVMgKyBTVFJPS0VXSURUSC8yIC0tPgogIDwhLS0gNi44NzU9IFJBRElVUyAtLT4KICA8IS0tIDEuMTI1PSAgU1RST0tFV0lEVEgvMiAtLT4KICA8ZyBjbGFzcz0icXAtY2lyY3VsYXItbG9hZGVyIj4KICAgIDxwYXRoIGNsYXNzPSJxcC1jaXJjdWxhci1sb2FkZXItcGF0aCIgZmlsbD0ibm9uZSIgCiAgICAgICAgICBkPSJNIDgsMS4xMjUgQSA2Ljg3NSw2Ljg3NSAwIDEgMSAxLjEyNSw4IiBzdHJva2Utd2lkdGg9IjIuMjUiCiAgICAgICAgICBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICA8L2c+Cjwvc3ZnPgo=)').css('padding', '1px 8px');
                    //self.submitForm(action);
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
            return self._clean(string).replace(/\\/g, '');
        },
        rate: function (ev) {
            //ev.preventDefualt();
            console.log(ev.target.previousElementSibling.getAttribute('value'));
            //updateTwoRandomPhotos();
            //getTwoRandomPhotos();
        }, // Only populate the friends page with all photos
        getFriendsList: function () {
            this.ajaxify({
                'url': '${baseURL}api/v1/photos/'
            });
        },
        getImages: function (config) {
            $.getJSON(config);
        },
        getPhotos: function () {
            $.ajax({
                url: '/api/v1/photos/all',
                type: 'get',
                dataType: 'json'
            }).done(function (data) {
                photos = data;
            }).fail(function (err) {
                console.log(err);
            })
        },
        getRankList: function () {
            this.ajaxify({
                'url': '/api/v1/photos/top',
                'dataType': 'json',
                'data': {
                },
                'success': function () {
                },
                'fail': function () {
                }
            });
        },
        dummy: function (text, callback) {
            callback(text);
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
                if (self.isValidUser()) {
                    if (followingSites.indexOf(currentHostName) <= - 1) {
                        followingSites.push(currentHostName);
                        var itemData = {
                            'following_sites': JSON.stringify(followingSites)
                        };
                        self.setData(itemData);
                        self.followSite();
                    } else {
                        self.getFollowingSites();
                    }
                } else {
                    self.showSignInForm();
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
            if (self.getItem('c_user_name') === '' || !self.getItem('c_user_name')) {
                return false;
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
        validateForm: function(e) {
            var m = $('textarea');
            typeof m.val() ? m.val() : null;
            if (m.val() == null){
                $('.results').html('Cannot send empty values');
                m.focus();
            }

            var options = {
                beforeSubmit: showRequest, // pre-submit callback
                success: showResponse // post-submit callback
            };

            // bind to the form's submit event
            e.submit(function () {
                $(this).ajaxSubmit(options); // always return false to prevent standard browser submit and page navigation
                return false;
            });

            // pre-submit callback
            function showRequest(formData, jqForm, options) {
                alert('Sending message to ' + formData);
                return true;
            }

            // post-submit callback
            function showResponse(responseText, statusText, xhr, $form) {
                alert('status: ' + statusText + '\n\nresponseText: \n' + responseText );
            }
        },
        submitForm: function () {
            return new Promise(function(resolve, reject){
                $.ajax({
                    url: '/api/v1/submit',
                    type: 'post',
                    data: {
                        name: $('[name=name]'),
                        id: $('[name=fb_id]'),
                        message: $('[name=message]')
                    },
                    success: function (error, response, body) {
                        if (error) $('.results').html('Failed to submit form, please try again later.'); reject(false);
                        $('.results').html('Sent successfully'); resolve(true);
                    }
                });
            })
        }
    };
    new StuckWanYah();
    function ajaxify(b) {
        var a = $.extend({
            async: true,
            crossDomain: true,
            actionURL: '',
            actionMethod: 'get',
            dataType: 'json',
            dataToSend: '',
            successCheck: function (c) {
                return false
            },
            sessionExpiredCheck: function (c) {
                return false
            },
            onSuccess: function () {
            },
            successMessage: '',
            errorMessage: '',
            sessionExpiredMessage: ''
        }, b);
        $.ajax(a.actionURL, {
            method: a.actionMethod,
            data: a.dataToSend,
            success: function (c) {
                if (a.sessionExpiredCheck(c)) {
                } else {
                    if (a.successCheck(c)) {
                        if (a.onSuccess != null && $.isFunction(a.onSuccess)) {
                            a.onSuccess();
                        }
                    }
                }
            }
        });
    }
    function change_myselect() {
        var xmlhttp,
            obj,
            dbParam;
        xmlhttp = new XMLHttpRequest();
        obj = {
            'field': $('ranking_type_field'),
            'gender': $('ranking_type_gender')
        };
        dbParam = JSON.stringify(obj);
        xmlhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var myObj,
                    txt,
                    x;
                myObj = JSON.parse(this.responseText);
                txt += '<table border=\'1\'>';
                for (x in myObj) {
                    txt += '<tr><td>' + myObj[x].name + '</td></tr>';
                }
                txt += '</table>';
                document.getElementById('demo').innerHTML = txt;
            }
        };
        xmlhttp.open('POST', '/api/v1/photos/top', true);
        xmlhttp.setRequestHeader('Content-type', 'application/x-www-formurlencoded');
        xmlhttp.send('x=' + dbParam);
    }
    function storeCurrentUser(userId, ratings) {
        $window.localStorage.currentUser = JSON.stringify(response.data.user);
        $rootScope.currentUser = JSON.parse($window.localStorage.currentUser);
        var my_ratings = {
            'image_id': ratings.image_id,
            'image_url': ratings.image_url
        };
        localStorage.setItem('c_user', userId);
        localStorage.setItem('ratings', my_ratings);
    }
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
    function isBigEnough(age) {
        var min = 13,
            max = 21;
        if (age >= min && age <= max) {
            return true;
        }
        return false;
    }
    function createDiv(id, className, child) {
        var div = document.createElement('div');
        div.id = id;
        div.className = className;
        div.append(child);
        return div;
    }
    function createImage(id, className, src, width, height) {
        var img = document.createElement('img');
        img.id = id;
        img.className = className;
        img.src = '/photos/' + src.slice(1, - 4) + '.jpg';
        img.width = typeof width == null ? '' : width;
        img.height = typeof height == null ? '' : height;
        return img;
    }
    function getByID(id) {
        return document.getElementById(id);
    }
    function getByClass(className) {
        return document.getElementsByClassName(className);
    } /*
    document.getElementsByClassName('code') [0].addEventListener('click', function (e) {
        var range = document.createRange();
        range.selectNode(document.getElementsByClassName(e.target.className));
        window.getSelection().addRange(range);
    });
    var buttons = document.getElementsByClassName('custom-fb-share');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].onmouseup = onClickShareButton;
    }*/

}(jQuery));
function sh(pageName) {
    $.ajax({
        async: true,
        crossDomain: true,
        type: 'put',
        url: '/api/v1/hits',
        data: {
            page: pageName
        }
    });
}
function facebook(appId, email, token) {
    this.app_id = appId;
    this.email = email;
    this.token = token;
}
facebook.prototype.connect = function (action) {
    FB.sdk(action);
};
var F = new facebook();
function rank() {
    var list,
        i,
        switching,
        b,
        shouldSwitch,
        ranking = 0;
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
    var list,
        i,
        switching,
        b,
        shouldSwitch,
        dir,
        switchcount = 0;
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
/*
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
    this.drawRectangle('#fff', 0, 0, this.context_width, this.context_height);
    this.player.draw();
};

Game.prototype.drawRectangle = function (color, x, y, width, height) {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, width, height);
};
