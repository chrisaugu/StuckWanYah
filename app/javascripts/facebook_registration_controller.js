if(typeof mnAngularModules == 'object'){
    mnAngularModules.push('facebookRegistration');    
}
facebookRegistrationApp = angular.module('facebookRegistration',[]);

//var facebookRegistrationApp = angular.module('facebookRegistration',[]);

facebookRegistrationApp.controller('facebookRegistrationPopupController', function($scope, $rootScope, $http){
    $rootScope.user = {type: null, isd: ""};
    var response = JSON.parse(localStorage.getItem("isdDetails"));
     if(response === null){
    $http.get('/userapi/location?op_code=ip_location&version=2')
        .success(function (response) {
            if(response.status == 1 && response.data && response.data.isd){
				localStorage.setItem("isdDetails", JSON.stringify(response));
                $rootScope.user.isd = '+' + response.data.isd;
                isd = $rootScope.user.isd;
                var isdCon = $('.mnCntryISD');
                isdCon.children('.flagOptn').val($rootScope.user.isd);
                for(var i = 0; i< countryISD.length ; i++){
                    if(countryISD[i]['d_code'] == $rootScope.user.isd){
                        isdCon.children('.isdFlag').text('');
                        isdCon.children('.isdFlag').css('background-position', countryISD[i]['position']);
                        break;
                    }
                };
                
            }
        });
	}else{
		       $rootScope.user.isd = '+' + response.data.isd;
                isd = $rootScope.user.isd;
                var isdCon = $('.mnCntryISD');
                isdCon.children('.flagOptn').val($rootScope.user.isd);
                for(var i = 0; i< countryISD.length ; i++){
                    if(countryISD[i]['d_code'] == $rootScope.user.isd){
                        isdCon.children('.isdFlag').text('');
                        isdCon.children('.isdFlag').css('background-position', countryISD[i]['position']);
                        break;
                    }
                };
	}
    $rootScope.submit_disabled = false;
    $rootScope.submit_text = "Join Now";
    //$rootScope.$on('got_fb_user_details',function(event, data){
    //   $scope.fb_user = data.fb_user;
    //   $scope.next_popup = data.next_popup;
    //});

    $scope.connectToMN = function(){
        $('.popupClose').trigger('click');
        $('#facebook_connect_mn_account_div').trigger('click');
    };

    $rootScope.addFacebookFriends = function(){
        if(!enableFbAutoAdd){
            return;
        }
        $http({
            method: "GET",
            url: '/mywall/addFacebookFriends?time=' + new Date().getTime(),
            headers: { 'X-Requested-With' :'XMLHttpRequest'}
        })
            .success(function(result) {
            });
    };

    $scope.register = function(){
        //validate
        if($('#userEmail').length > 0){
            validateRegForm1(document.getElementById('userEmail'),'Email','d');
        }
        validateRegForm1(document.getElementById('userClass'),'Grade','d');
        validateRegForm1(document.getElementById('userBoard'),'Board','d');
        validateRegForm1(document.getElementById('userMobile'),'Mobile','d');

        if($('.FBrevamp .regLogErr').length != 0){
            $('.FBrevamp .regLogErr')[0].focus();
            return;
        }

        $scope.user.name = $scope.fb_user.first_name + " " + $scope.fb_user.last_name;
        $rootScope.user_reg_details = $scope.user;
        $rootScope.user_reg_details.email = $scope.user.email ? $scope.user.email:$scope.fb_user.email;
        if($scope.next_popup){
            $('.popupClose').trigger('click');
            $($scope.next_popup).trigger('click');
        }else{
            $scope.registerRequest();
        }
    };


    $rootScope.registerRequest = function(){
        if($rootScope.user_reg_details.pincode == undefined){
            $rootScope.user_reg_details.pincode = '';
        }
        if($rootScope.user_reg_details.get_premium == undefined){
            $rootScope.user_reg_details.get_premium = 0;
        }
        if($rootScope.user_reg_details.isd == undefined){
            $rootScope.user_reg_details.isd = '+91';
        }
        $rootScope.submit_disabled = true;
        $rootScope.submit_text = "Wait...";
        $(document).triggerHandler('registration.start');
        var postData = {
            access_token: FB.getAccessToken(),
            method: "newConnection",
            gradeId: $rootScope.user_reg_details.grade,
            curriculumId: $rootScope.user_reg_details.curriculum,
            mobile: $rootScope.user_reg_details.mobile,
            userType: $rootScope.user_reg_details.type,
            pincode: $rootScope.user_reg_details.pincode,
            getPremium: $rootScope.user_reg_details.get_premium,
            isd: $rootScope.user_reg_details.isd
        };

        if($rootScope.user_reg_details != undefined){
            postData.email = $rootScope.user_reg_details.email;
        }
        $http({
            method: "POST",
            url: "/userapi/thirdpartyauth/facebook?op_code=association",
            data: postData
        }).success(function(response){
            if(response.status == 1){
                $rootScope.addFacebookFriends();
                window.location = response.data.redirect_url;
            }else{
                $rootScope.submit_disabled = false;
                $rootScope.submit_text = "Join Now";
                $(document).triggerHandler('registration.end');
                if(response.data && response.data.state == 'fb_email_registered'){
                    $rootScope.selected_account = response.data.fb_user.id;
                    next_popup="#facebook_link_account_popup_div";
                    $rootScope.enable_back = false;
                }else if(response.data && response.data.state == 'fb_email_registered_and_linked_to_other_fb'){
                    if(response.data.mn_user.has_password == false){
                        next_popup="#facebook_account_already_exists_popup_div";
                    }else{
                        next_popup="#facebook_register_account_conflict_div";
                    }
                }else{
                    alert("Oops! Something went wrong!");
                }

                $rootScope.fb_user = response.data.fb_user;
                if(response.data.mn_user != undefined) {
                    $rootScope.mn_user = response.data.mn_user;
                    if($rootScope.user_reg_details.email != undefined){
                        $rootScope.mn_user.mn_email = $rootScope.user_reg_details.email;
                    }
                }

                $('.popupClose').trigger('click');
                $(next_popup).trigger('click');


            }

        });
    };

});


facebookRegistrationApp.controller('facebookRegistrationConflictController', function($scope, $rootScope, $http){

    $scope.confirmation = function(selection){
        $rootScope.selected_account = selection;
        $rootScope.enable_back = true;
        $rootScope.conflict_case = true;
        $('.popupClose').click();
        $('#facebook_link_account_popup_div').click();
    };

});


facebookRegistrationApp.controller('facebookLinkAccountController',function($scope, $http, $rootScope){
    $(document).on('facebook_link_account_popup_opened',function(){
        //$scope.mn_user = $rootScope.mn_user;
        //$scope.selected_account = $rootScope.selected_account;
        $scope.submit_disabled = false;
        if($scope.selected_account == $scope.fb_user.id){
            $scope.user_name = $scope.fb_user.first_name;
            $scope.submit_text = "Link";
        }else{
            $scope.user_name = $scope.mn_user.first_name;
            $scope.submit_text = "Login";
        }
    });


    $scope.linkFbAccount = function(){
        $scope.submit_disabled = true;
        old_submit_text = $scope.submit_text;
        $scope.submit_text = "Wait...";
        if($scope.password == undefined || $scope.password == ""){
            alert("Please enter password");
            $scope.submit_text = "Link";
            $scope.submit_disabled = false;
            return false;
        }

        if($scope.selected_account == $scope.fb_user.id){
            var postData = {
                access_token: FB.getAccessToken(),
                method: "changeAccount",
                username: $scope.mn_user.mn_email,
                password: $scope.password,
                linkedFbId: $scope.mn_user.linked_fb_id
            };

            if($scope.conflict_case != true){
                postData.method = "linkAccount";
                delete postData.linkedFbId;
            }

            $http({
                method: "POST",
                url: "/userapi/thirdpartyauth/facebook?op_code=association",
                data: postData
            }).success(function(response){
                if(response.status == 1){
                    $rootScope.addFacebookFriends();
                    window.location = response.data.redirect_url;
                }else{
                    if(response.error && response.error.message) {
                        alert(response.error.message);
                    }else{
                        alert("Oops! Something went wrong!");
                    }
                    $scope.submit_text = old_submit_text;
                    $scope.submit_disabled = false;
                }

            });
        }else{
            var postData = {
                username: $scope.mn_user.mn_email,
                password: $scope.password,
                login: 1
            };

            $http({
                method: "POST",
                url: "/userapi/users/authenticate",
                data: postData
            }).success(function(response){
                if(response.status == "success"){
                    $rootScope.addFacebookFriends();
                    window.location = response.redirectUrl;
                }else{
                    if(response.error && response.error.message) {
                        alert(response.error.message);
                    }else{
                        alert("Oops! Something went wrong!");
                    }
                    $scope.submit_text = old_submit_text;
                    $scope.submit_disabled = false;
                }

            });
        }
        return false;
    };

    $scope.back = function(){
        $('.popupClose').trigger('click');
        if($scope.enable_back == true){
            $('#facebook_register_account_conflict_div').trigger('click');
        }
    };

});


facebookRegistrationApp.controller('facebookLoginController',function($scope, $http, $rootScope){
    $scope.submit_text = "Connect";
    $scope.submit_disabled = false;
    $(document).on('facebook_link_account_popup_opened',function(){
        //$scope.mn_user = $rootScope.mn_user;
    });

    $scope.connectFbAccount = function(){
        $scope.submit_text = "Wait...";
        $scope.submit_disabled = true;
        if($scope.password == undefined || $scope.password == "" || $scope.username == undefined || $scope.username == ""){
            alert("Please enter username and password");
            $scope.submit_text = "Connect";
            $scope.submit_disabled = false;
            return false;
        }
            var postData = {
                access_token: FB.getAccessToken(),
                method: "linkAccount",
                username: $scope.username,
                password: $scope.password,
                login: 0
            };

            $http({
                method: "POST",
                url: "/userapi/thirdpartyauth/facebook?op_code=association",
                data: postData
            }).success(function(response){
                if(response.status == 1){
                    $rootScope.addFacebookFriends();
                    window.location = response.data.redirect_url;
                }else{
                    if(response.error && response.error.message){
                        alert(response.error.message);
                    }else if(response.data && response.data.state == "fb_email_registered_and_linked_to_other_fb"){
                        if(response.data.mn_user.has_password == false){
                            next_popup="#facebook_account_already_exists_popup_div";
                        }else{
                            next_popup="#facebook_register_account_conflict_div";
                        }
                        $rootScope.fb_user = response.data.fb_user;
                        $rootScope.mn_user = response.data.mn_user;
                        $rootScope.mn_user.mn_email = $scope.username;
                        $('.popupClose').trigger('click');
                        $(next_popup).trigger('click');
                    }else{
                        alert("Oops! Something went wrong!");
                    }
                    $scope.submit_text = "Connect";
                    $scope.submit_disabled = false;
                }

            });
    };
});



facebookRegistrationApp.controller('facebookRegistrationHeaderController', function($scope, $rootScope, $http){



    $(document).on("fb_loaded",function(){
        window.fb_loaded_var = 1;
        if((getCookie('showFbHeader') != undefined && getCookie('showFbHeader') != "") || (getCookie("CakeCookie[fbAutoLogin]")!=undefined && getCookie("CakeCookie[fbAutoLogin]")!="")){
            return false;
        }
        FB.getLoginStatus(function (fb) {
            if (fb.status === 'connected') {
                var userFbAccessToken = FB.getAccessToken();
                if (userFbAccessToken != null){
                    $http({
                        method: "POST",
                        url: "/userapi/thirdpartyauth/facebook?op_code=association",
                        data: {
                            access_token : userFbAccessToken,
                            method : "userStatus"
                        }
                    }).success(function(response){
                        if(response.data.state == 'already_linked'){
                            $rootScope.fb_user = response.data.fb_user;
                            $('#autoLoginLoading').trigger('click');
                            if((new Date).getTime() < 1481608800000){
                                $rootScope.addFacebookFriends();
                            }
                            window.location = response.data.redirect_url;
                            return;
                        }else{
                            $('.loginErrorMsg').html("<span class='dontHaveAcc'>You dont have an account. Please <a onclick=\"mnRegLoginPopup.showRegister(this)\" style=\"cursor: pointer\">Sign Up<\a>");
                            $('.loginErrorMsg').show();
                        }

                        /*else if(response.data.state == "fb_email_registered_and_linked_to_other_fb"){
                            if(response.data.mn_user.has_password == false){
                                next_popup="#facebook_account_already_exists_popup_div";
                            }else{
                                next_popup="#facebook_register_account_conflict_div";
                            }
                        }else if(response.data.state == "fb_email_registered"){
                            $rootScope.selected_account = response.data.fb_user.id;
                            next_popup="#facebook_link_account_popup_div";
                            $rootScope.enable_back = false;
                        }else {
                            next_popup=null;
                        }

                        $('body').addClass('fbHeaderVisible');
                        $("#fb_reg_header").slideDown(600).addClass('FB_header_visible');
                        $rootScope.join_now_vars = response.data;
                        api_response = {fb_user:response.data.fb_user, next_popup:next_popup}
                        if(response.data.mn_user != undefined){
                            api_response.mn_user = response.data.mn_user;
                            $rootScope.mn_user = response.data.mn_user;
                        }
                        $rootScope.fb_user = response.data.fb_user;
                        $rootScope.next_popup = next_popup;
                        //$rootScope.$broadcast('got_fb_user_details',api_response);
                        $scope.fb_user = response.data.fb_user;
//                        delete $scope.fb_user.email; */
                    });
                }
            }else{
                console.log('user not logged in');
            }
        });
        return true;
    });

    if(window.fb_loaded_var === undefined && typeof FB !== "undefined"){
        $(document).trigger("fb_loaded");
    }

    var accessToken = '';
    var facebookUserID = '';
    var token_expiry = '24000';
    var fb_window = '';
    var website_source_button = 'Register';
    var keywordForAppCentreListingPage = 'social_source';
    var keywordValueForAppCentreListingPage = 'coming_from_facebook';
    var fb_user_click_allow = false;//var declare for fb tracking user click entry in facebook_user_clicks table

    $scope.ngSocialize = function(refid){
        var button = 'register';
        if (typeof(refid) == 'undefined' || refid == undefined || refid == null) {
            refid = 'standard';
            button = 'header';
            website_source_button = 'Login';
        }
        if (typeof(fb_window) != 'object' || fb_window.closed == true) {
            fb_user_click_allow = true;
            FB.login(function (response) {
                if (response.authResponse) {
                    var userFbAccessToken = FB.getAccessToken();
                    $http({
                        method: "POST",
                        url: "/userapi/thirdpartyauth/facebook?op_code=connect",
                        data: {
                            access_token : userFbAccessToken
                        }
                    }).success(function(response){
                        if(response.data.state == 'already_linked'){
                            if((new Date).getTime() < 1481608800000){
                                $rootScope.addFacebookFriends();
                            }
                            window.location = response.data.redirect_url;
                            return;
                        }else{
                            $('.loginErrorMsg').html("<span class='dontHaveAcc'>You dont have an account. Please <a onclick=\"mnRegLoginPopup.showRegister(this)\" style=\"cursor: pointer\">Sign Up<\a>");
                            $('.loginErrorMsg').show();
                        }

                        /*else if(response.data.state == "fb_email_registered_and_linked_to_other_fb"){
                            if(response.data.mn_user.has_password == false){
                                next_popup="#facebook_account_already_exists_popup_div";
                            }else{
                                next_popup="#facebook_register_account_conflict_div";
                            }
                        }else if(response.data.state == "fb_email_registered"){
                            $rootScope.selected_account = response.data.fb_user.id;
                            next_popup="#facebook_link_account_popup_div";
                            $rootScope.enable_back = false;
                        }else {
                            next_popup=null;
                        }

                        api_response = {fb_user:response.data.fb_user, next_popup:next_popup}
                        if(response.data.mn_user != undefined){
                            api_response.mn_user = response.data.mn_user;
                            $rootScope.mn_user = response.data.mn_user;
                        }
                        $rootScope.fb_user = response.data.fb_user;
                        $rootScope.next_popup = next_popup;
                        //$rootScope.$broadcast('got_fb_user_details',api_response);
                        $scope.fb_user = response.data.fb_user;
//                        delete $scope.fb_user.email;
                        $scope.openPopup();
*/
                    });
                }

            }, {scope: facebookLoginScope});
        } else if (fb_window.closed == false) {
            fb_user_click_allow = false;
            fb_window.focus();
        }
    };

    $scope.openPopup = function(){
        if($rootScope.fb_user.email != undefined && $rootScope.next_popup != null){
            if($rootScope.mn_user != undefined){
                $rootScope.mn_user.mn_email = $rootScope.fb_user.email;
            }
            $($rootScope.next_popup).trigger('click');
        }else{
            $('#facebook_registration_popup_div').trigger('click');
        }
    };

    $rootScope.hideHeader = function(){
        $('body').removeClass('fbHeaderVisible');
        $('#fb_reg_header').slideUp().removeClass('FB_header_visible');
        setCookie('showFbHeader','false');
        delete $rootScope.join_now_vars;
    }

});


facebookRegistrationApp.controller('facebookLoadingController', function($scope, $rootScope, $http){

});


facebookRegistrationApp.controller('facebookErrorController', function($scope, $rootScope, $http){

});


facebookRegistrationApp.controller('joinNowController', function($scope, $rootScope, $http){
    $scope.FBuser = 'FBuser';
    $rootScope.submit_disabled = false;
    $rootScope.submit_text = "Join Now";
    //if($rootScope.join_now_vars != undefined){
    //    $scope.join_now =
    //}

    $scope.submitNgRegForm = function(form,type){
        if(false && $scope.join_now_vars && $scope.join_now_vars.fb_user!=undefined){
            //validate
            var inputs =$('#'+type+' :input:not(:button,:submit,:radio,:hidden)');
            for(var ni=0; ni<inputs.length;ni++){
                if(inputs[ni].name=='data[User][email]'){
                    validateF=validateRegForm1(inputs[ni],'Email','d');
                    if(!validateF) return false;
                }
                if(inputs[ni].name=='data[UserDetail][gradeId]'){
                    validateF=validateRegForm1(inputs[ni],'Grade','d');
                    if(!validateF) return false;
                    if($scope.user.grade == undefined){
                        $scope.user.grade = inputs[ni].value;
                    }
                }
                if(inputs[ni].name=='data[UserDetail][curriculumId]'){
                    validateF=validateRegForm1(inputs[ni],'Board','d');
                    if(!validateF) return false;
                    if($scope.user.curriculum == undefined){
                        $scope.user.curriculum = inputs[ni].value;
                    }
                }
                if(inputs[ni].name=='data[UserDetail][mobile]'){
                    validateF=validateRegForm1(inputs[ni],'Mobile','d');
                    if(!validateF) return false;
                }
                if(inputs[ni].name=='data[UserDetail][userType]'){
                    validateF=validateRegForm1(inputs[ni],'userType','d');
                    if(!validateF) return false;
                }
            }

            if($scope.user.pincode == undefined){
                $scope.user.pincode='';
            }

            if($scope.user.isd == undefined){
                $scope.user.isd='+91';
            }

            if($(form).attr('data-subscription')=='paid'){
                $scope.user.get_premium = 1;
            }else{
                $scope.user.get_premium = 0;
            }

            $scope.user.name = $scope.fb_user.first_name + " " + $scope.join_now_vars.fb_user.last_name;
            $scope.user.email = $scope.user.email ? $scope.user.email:$scope.join_now_vars.fb_user.email;
            $rootScope.user_reg_details=$scope.user;
            if($('.FBrevamp .regLogErr').length == 0){
                if($scope.next_popup){
                    if($scope.join_now_vars.mn_user != undefined){
                        $rootScope.mn_user.mn_email = $scope.join_now_vars.fb_user.email;
                    }
                    $('.popupClose').trigger('click');
                    $($scope.next_popup).trigger('click');
                }else{
                    $rootScope.registerRequest();
                }
            }else{
                $('.FBrevamp .regLogErr')[0].focus();
            }
        }else{ 
            submitButton = $(form);
            return submitMnRegForm(submitButton,type);
        }
    };

    $scope.blurEmail = function(event){
        var emailInput = event.target;
        if($(emailInput).is(':visible')){
            if($scope.join_now_vars && $scope.join_now_vars.fb_user!=undefined){
                validateRegForm1(emailInput,'Email','d');
            }else{
                if(validateRegForm1(emailInput,'Email','d')){
                    checkAvalability_new(emailInput,'d');
                }
            }
        }
    };

});
