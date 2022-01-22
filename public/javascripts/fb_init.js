window.fbAsyncInit = function() {
    fb_app_id = '';
    fb_fanpage_id = '';
    $('script[src* = "fb_init"]').each(function() {
        var js_loc = ($(this).attr('src'));
        var p = js_loc.indexOf('?');
        if(p! = -1) {
            var pairs = js_loc.substr(p+1).split('&');
            for(var i = 0;i<pairs.length;i++) {
                var param = pairs[i].split(' = ');
                if(param.length == 2) {
                    if(param[0] == 'fb_app_id') {
                        fb_app_id = parseInt(param[1],10);}

                    if(param[0] == 'fb_fanpage_id') {
                        fb_fanpage_id = parseInt(param[1],10);}
                }
            }
        }
    });
    FB.init({
        appId: fb_app_id,
        status:true,
        cookie:true,
        xfbml:true,
        oauth:true
    });
    var connected = false;
    var user,
        access_token,
        offline,
        pubStream,
        permsNeeded;

    function checkAuthToken(user_id) {
        var returnVal = null;
        $.ajax({
            url: '/facebook_connect/check_user/'+user_id,
            async:false,
            success:function(response) {
                var obj = JSON.parse(response);
                if(obj.success == true) {
                    returnVal = true;
                } else {
                    returnVal = false;
                }
            }
        });
        return returnVal;
    }

    function save_access_token_callback2(token,fbid) {
        $.ajax({
                url: '/facebook_connect/save_token/'+token+'/'+fbid,
                async:false,
                success:function(response) {
                    var obj = JSON.parse(response);
                    if(obj.success == true) {
                        return;
                    } else {
                        return;
                    }
                }
            }

        );}

    FB.getLoginStatus(function(response) {
        if(response.authResponse) {
            user = response.authResponse.userID;
            access_token = response.authResponse.accessToken;
            var test = null;
            test = checkAuthToken(user);
            if(test&&response.status == "connected") {
                connected = true;
            } else if(response.status == "connected") {
                save_access_token_callback2(access_token,user);
                checkAuthToken(user);
            } else {
                save_access_token_callback2(access_token,user);
                checkAuthToken(user);}
        }

        if(window.location.pathname == "/facebook_connect") {
            $('#full_perms_button').hide();
            FB.api({
                method: 'fql.query',
                query:'select publish_stream from permissions where uid = '+user
            }, function(data) {
                console.log(data);
                pubStream = data[0].publish_stream;
            });
            if(pubStream == 0) {
                $('#referring_fb').text("Recent changes require we update your InboxDollars connection with Facebook");
                $('#referring_fb').css({
                    'color': '#c73393','font':'Arial','font-weight':'bold','font-size':'14px'
                });
                $('#full_perms_button').show();
            }
        }

        if(window.location.pathname == "/facebook_connect/like_us") {
            if(user&&fb_fanpage_id) {
                var fql_query = "SELECT uid FROM page_fan WHERE page_id  =  "+fb_fanpage_id+"and uid = "+user;
                FB.api({
                    method: 'fql.query',
                    query:fql_query
                }, function(data) {
                    console.log(data);
                    if(data.length>0&&data[0].uid == user) {
                        gotLiked();}
                });
            }

            FB.Event.subscribe('edge.create',function(href,widget) {
                gotLiked();
            });
        }
    });
}
