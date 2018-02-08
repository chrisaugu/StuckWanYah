(function(){
    "use strict";
    var xmlhttp=null,photos=[],current_page=document.location.pathname;

    FB.init({
        appId: 'Your_Application_ID',
        status: true,
        cookie: true,
        xfbml: true
    });

    $(function(){
        switch (fancy(current_page)){
            case "/":
                getTwoRandomPhotos();
                break;
            case "/submit.html":
                $("[name=name]").val(localStorage.getItem("c_user_name"));
                $("[name=fb_id]").val(localStorage.getItem("c_user_id"));
                break;
            case "/rankings.html":
                /*renderRankList({
                    "field": $("#ranking_type_field").val(),
                    "gender": $("#ranking_type_gender").val()
                });*/
                renderRankList();
                break;
            case "/friends.html":
                renderFriendsList();
                break;
        }
        $("body")
            .on("click", ".button", function(){
                if($(this).attr("data-action")){
                    handleAction($(this).attr("data-action"), $(this).attr("data-id") ? $(this).attr("data-id") : null);
                }
            })
            .on("click", "a", function(){
                if ($(this).attr("data-action")){
                    handleAction($(this).attr("data-action"), $(this).attr("data-id") ? $(this).attr("data-id") : null);
                }
            })
            .on("keyup", "form[data-form='submit'] textarea", function(){
                var len = clean($(this).val()).length;
                var $counter = $("#counter");
                if(len <= 120){
                    $counter.html((120 - len) + " characters remaining");
                }
            })
            .on("change", "#ranking_type_field", function(e){
                var params = {
                    "field": e.target.value,
                    "gender": $("#ranking_type_gender").val()
                };
                renderRankList(params);
            })
            .on("change", "#ranking_type_gender", function(e){
                var params = {
                    "field": $("#ranking_type_field").val(),
                    "gender": e.target.value
                };
                renderRankList(params);
            })
            .on("click", "#connect_facebook", function(){
                handleAction("facebook_connect", $(this).attr("id"));
            })
            .on("submit", "form", function(event){
                event.preventDefault(); // No need to do anything else, on click for .button already takes care of things
            });
    });

    function renderImages(){
        $.ajax({
            url: "/api/photos",
            type: "GET",
            dataType: "json",
            data: {
                gender: getPreferredGender()
            }
        }).done(function(photo){
            if(data.data.length < 2){
                $("#main-display").html("<p>There aren't enough players of this gender currently. You could help <a href='#submit'>change that</a>.</p>");
                return;
            }
            var $display = $("#main-display");
            $display.hide();
            // Player 1
            var id = data.data[0].id;
            $("#player-one")
                .attr("src", "api/photo.php?id=" + id)
                .attr("data-id", id);
            // Player 2
            id = data.data[1].id;
            $("#player-two")
                .attr("src", "api/photo.php?id=" + id)
                .attr("data-id", id);
            $display.fadeIn(600);
        }).fail(function(err){})
    }
    function getTwoRandomPhotos(){
        $.getJSON("/api/photos", function(photos){
            $.each(photos, function(i, photo){
                $("#photos [name=contenderId]").eq(i).attr("value", photo.user_id);
                $("#photos input:image").eq(i).attr("src", photo.image_url);
                $("#ratings .ratings").eq(i).html(photo.ratings);
                $("#wins .winings").eq(i).html(photo.wins);
                $("#wins .losings").eq(i).html(photo.losses);
                $("#scores .scorings").eq(i).html(photo.scores);
                $("#expectations .expectations").eq(i).html(photo.expectations);
            });
        });
    }
    function rate(ev){
        //ev.preventDefualt();
        console.log(ev.target.previousElementSibling.getAttribute("value"));
        //updateTwoRandomPhotos();
        //getTwoRandomPhotos();
    };

    // Only populate the friends page with all photos
    /**
     * @return {number}
     */
    function renderFriendsList(){
        $.getJSON("/api/photos/all",
            function(data) {
                var output = "";
                output += '<tr>';
                output += '<td class="photos" style="width: 902px;">';
                $.each(data, function(i, item) {
                    output += '<a href=\"' + item.uri + '\" data-fb-id=\"'+ item.image_id +'\">';
                    output += '<img class="photo" src="/photos/' + item.image_url + '" style="width:70px!important">';
                    output += '</a>';
                })
                output += '</td>';
                output += '</tr>';
                $("#photos").html(output);
            }
        )
    }

    /**
     * @return {number}
     * Only populate the ranking page with top 10 hottest friends
     */
    function renderRankList(rankingField){
        console.log(rankingField);
        $.getJSON({
            "url":"/api/photos/top",
            "data": rankingField
        }, function(data) {
                var output = "";
                $.each(data, function(i, item) {
                    output += "<tr>";
                    output += "<td>";
                    output += "<img class='photo' src='/photos/" + item.image_url + "' data-fb-id=\""+ item.image_id +"\" width='180'>";
                    output += "</td>";
                    output += "<td>";
                    output += "</td>";
                    output += "<td>";
                    output += item.ratings;
                    output += "</td>";
                    output += "<td>";
                    output += "</td>";
                    output += "<td>";
                    output += item.rankings;
                    output += "</td>";
                    output += "</tr>";
                })
                $("#rankings").html(output);
            }
        )
    }
    function randomizePhotos(array) {
        /* round the product of random number and photos length and add 1 */
        var rand = Math.floor(Math.random() * array.length) + 1;
        /* check if rand is not exceeding photo lengths and below 0 */
        if (rand < 0) {
            if(rand >= array.length){
                return (rand / 2);
            }
            random_item()
        }
        console.log(rand);
        return rand;
    }
    function random(array){
        return (Math.random() * array.length + 1);
    }
    function change_myselect() {
        var xmlhttp, obj, dbParam;
        xmlhttp = new XMLHttpRequest();

        obj = { 
            "field":$("ranking_type_field"), 
            "gender":$("ranking_type_gender") 
        };

        dbParam = JSON.stringify(obj);
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                myObj = JSON.parse(this.responseText);
                txt += "<table border='1'>";
                for (x in myObj) {
                    txt += "<tr><td>" + myObj[x].name + "</td></tr>";
                }
                txt += "</table>";
                document.getElementById("demo").innerHTML = txt;
            }
        };
        xmlhttp.open("POST", "/api/photos/top", true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-formurlencoded");
        xmlhttp.send("x=" + dbParam);
    }
    function storeCurrentUser(userId, ratings) {
        $window.localStorage.currentUser = JSON.stringify(response.data.user);
        $rootScope.currentUser = JSON.parse($window.localStorage.currentUser);

        var my_ratings = {
            "image_id": ratings.image_id,
            "image_url": ratings.image_url
        }

        localStorage.setItem("c_user", userId);
        localStorage.setItem("ratings", my_ratings);
    }
    function isAuthenticated(){
        return this.isAuthenticated();
    }
    function signup() {
        this.signup = function() {
            var user = {
                email: this.email,
                password: this.password
            };
            this.signup = function(user) {}
        }
    }
    function isLoggedIn(){
        // TODO: Fix synchronous AJAX request, use async method instead
        var loggedIn = false;
        $.ajax({
            url: "/api/auth",
            type: "post",
            dataType: "json",
            async: false
        }).done(function(data){
            loggedIn = data.data.logged_in;
        }).fail(function(data){
            loggedIn = false; 
        });
        return loggedIn;
    }
    // if(firstName && gender && isValidPhoto($("#submit_photo").val())){
    function RequestGraphApi() {
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN",
            "method": "POST",
            "headers": {
                "content-type": "application/json"
            },
            "processData": false,
            "data": "{\n\t\"setting_type\": \"call_to_actions\",\n\t\"thread_state\": \"new_thread\",\n\t\"call_to_actions\": [\n\t\t{\n\t\t\t\"payload\": \"GET_STARTED\"\n\t\t}\n\t]\n}"
        };

        $.ajax(settings).done(function (response) {
            console.log(response);
        });
    }
    function RequestGraphApi2() {
        var data = JSON.stringify({
            "setting_type": "call_to_actions",
            "thread_state": "new_thread",
            "call_to_actions": [
                {
                    "payload": "GET_STARTED"
                }
            ]
        });
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.addEventListener("readystatechange", function(){
            if (this.readyState === 4) {
                console.log(this.responseText);
            }
        });
        xhr.open("POST", "https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN");
        xhr.setRequestHeader("content-type", "application/json");
        xhr.send(data);
    }
    function isBigEnough(age) {
        var min = 13, max = 21;
        if (age >= min && age <= max) {
            return true;
        }
        return false;
    }
    function createDiv(id, className, child) {
        var div = document.createElement("div");
        div.id = id;
        div.className = className;
        div.append(child);
        return div;
    }
    function createImage(id, className, src, width, height) {
        var img=document.createElement("img");
        img.id=id;
        img.className=className;
        img.src="/photos/"+src.slice(1,-4)+".jpg";
        img.width= (typeof width == null ? "" : width);
        img.height= (typeof height == null ? "" : height);
        return img;
    }
    function getByID(id) {
        return document.getElementById(id);
    }
    function getByClass(className) {
        return document.getElementsByClassName(className);
    }
    document.getElementsByClassName('code')[0].addEventListener("click", function(e) {
        var range = document.createRange();
        range.selectNode(document.getElementsByClassName(e.target.className));
        window.getSelection().addRange(range);
    });

    var buttons = document.getElementsByClassName("custom-fb-share");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].onmouseup = onClickShareButton;
    }
    function onClickShareButton(e) {
        e.preventDefault && e.preventDefault();
        var link = this.getAttribute("data-href") || "https://stuckwanyah.herokuapp.com/";
        window.open("http://www.facebook.com/dialog/share?app_id=362497390470077&href=" + 
            encodeURIComponent(link) + "&redirect_uri=" + 
            encodeURIComponent("https://stuckwanyah.herokuapp.com/") + "&display=popup",
            "Stuck Wan Yah",
            "resizable,scrollbars,status,width=500,height=500");
        return false;
    }
    var connect_facebook = function(){
        FB.api("/me", function (response) {
            alert('Name is ' + response.name);
        }); 
    }
    function clean(string){
        return string.trim().replace(/\s+/g, " "); // Remove leading/trailing whitespaces and multiple whitespaces
    }
    function fancy(string){
        return clean(string).replace(/\\/g, "");
    }
    function getPreferredGender(){
        var gender = store.get("gender");
        // If 'gender' doesn't exist, or if existing 'gender' isn't female or male
        if(!store.has("gender") || (gender !== "f" && gender !== "m")){
            gender = "f";
        }
        store.set("gender", gender);
        return gender;
    }
    function setData(data){
        localStorage.setItem("c_user",JSON.stringify(data));
    }
    function getLocalStorageItem(key){
        localStorage.getItem(key);
    }
    function isValidPhoto(filename){
        var extension = filename.replace(/^.*\./, ""); // Replace until we're left with the file extension
        if(filename == extension){
            extension = ""; // File has no extension, so it's blank
        }
        else{
            extension = extension.toLowerCase();
        }
        switch(extension){
            case "gif":
            case "jpg":
            case "png":
                return true;
            default:
                return false;
        }
    }
    function submit_form(){
        $.ajax({
            url:"/api/submit",
            type:"post",
            data:{
                name: $("[name=name]"),
                id: $("[name=fb_name]"),
                message: $("[name=message]")
            },
            success: function(error, response, body){
                if (error) $(".results").html("Failed to submit form, please try again later.");
                $(".results").html("Sent successfully");
            }
        });
        return false;
    }
    function handleAction(action, data){
        switch(action.toLowerCase()){
            case "submit":
                $(".results").css("background", "url(data:image/svg+xml;base64,PCEtLSBUaGlzIHZlcnNpb24gb2YgdGhlIHRocm9iYmVyIGlzIGdvb2QgZm9yIHNpemVzIGxlc3MgdGhhbiAyOHgyOGRwLAogICAgIHdoaWNoIGZvbGxvdyB0aGUgc3Ryb2tlIHRoaWNrbmVzcyBjYWxjdWxhdGlvbjogMyAtICgyOCAtIGRpYW1ldGVyKSAvIDE2IC0tPgo8c3ZnIHZlcnNpb249IjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgICAgICAgICAgICAgICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIKICAgICB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiPgogIDwhLS0gMTY9IFJBRElVUyoyICsgU1RST0tFV0lEVEggLS0+CgogIDx0aXRsZT5NYXRlcmlhbCBkZXNpZ24gY2lyY3VsYXIgYWN0aXZpdHkgc3Bpbm5lciB3aXRoIENTUzMgYW5pbWF0aW9uPC90aXRsZT4KICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgogICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKiovCiAgICAgIC8qIFNUWUxFUyBGT1IgVEhFIFNQSU5ORVIgKi8KICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqLwoKICAgICAgLyoKICAgICAgICogQ29uc3RhbnRzOgogICAgICAgKiAgICAgIFJBRElVUyAgICAgID0gNi44NzUKICAgICAgICogICAgICBTVFJPS0VXSURUSCA9IDIuMjUKICAgICAgICogICAgICBBUkNTSVpFICAgICA9IDI3MCBkZWdyZWVzIChhbW91bnQgb2YgY2lyY2xlIHRoZSBhcmMgdGFrZXMgdXApCiAgICAgICAqICAgICAgQVJDVElNRSAgICAgPSAxMzMzbXMgKHRpbWUgaXQgdGFrZXMgdG8gZXhwYW5kIGFuZCBjb250cmFjdCBhcmMpCiAgICAgICAqICAgICAgQVJDU1RBUlRST1QgPSAyMTYgZGVncmVlcyAoaG93IG11Y2ggdGhlIHN0YXJ0IGxvY2F0aW9uIG9mIHRoZSBhcmMKICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCByb3RhdGUgZWFjaCB0aW1lLCAyMTYgZ2l2ZXMgdXMgYQogICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNSBwb2ludGVkIHN0YXIgc2hhcGUgKGl0J3MgMzYwLzUgKiAyKS4KICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZvciBhIDcgcG9pbnRlZCBzdGFyLCB3ZSBtaWdodCBkbwogICAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMzYwLzcgKiAzID0gMTU0LjI4NikKICAgICAgICoKICAgICAgICogICAgICBTSFJJTktfVElNRSA9IDQwMG1zCiAgICAgICAqLwoKICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciB7CiAgICAgICAgd2lkdGg6MTZweDsgIC8qIDIqUkFESVVTICsgU1RST0tFV0lEVEggKi8KICAgICAgICBoZWlnaHQ6MTZweDsgLyogMipSQURJVVMgKyBTVFJPS0VXSURUSCAqLwogICAgICB9CiAgICAgIC5xcC1jaXJjdWxhci1sb2FkZXItcGF0aCB7CiAgICAgICAgc3Ryb2tlLWRhc2hhcnJheTogMzIuNDsgIC8qIDIqUkFESVVTKlBJICogQVJDU0laRS8zNjAgKi8KICAgICAgICBzdHJva2UtZGFzaG9mZnNldDogMzIuNDsgLyogMipSQURJVVMqUEkgKiBBUkNTSVpFLzM2MCAqLwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBoaWRlcyB0aGluZ3MgaW5pdGlhbGx5ICovCiAgICAgIH0KCiAgICAgIC8qIFNWRyBlbGVtZW50cyBzZWVtIHRvIGhhdmUgYSBkaWZmZXJlbnQgZGVmYXVsdCBvcmlnaW4gKi8KICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciwgLnFwLWNpcmN1bGFyLWxvYWRlciAqIHsKICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiA1MCUgNTAlOwogICAgICB9CgogICAgICAvKiBSb3RhdGluZyB0aGUgd2hvbGUgdGhpbmcgKi8KICAgICAgQGtleWZyYW1lcyByb3RhdGUgewogICAgICAgIGZyb20ge3RyYW5zZm9ybTogcm90YXRlKDBkZWcpO30KICAgICAgICB0byB7dHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTt9CiAgICAgIH0KICAgICAgLnFwLWNpcmN1bGFyLWxvYWRlciB7CiAgICAgICAgYW5pbWF0aW9uLWR1cmF0aW9uOiAxNTY4LjYzbXM7IC8qIDM2MCAqIEFSQ1RJTUUgLyAoQVJDU1RBUlRST1QgKyAoMzYwLUFSQ1NJWkUpKSAqLwogICAgICAgIGFuaW1hdGlvbi1pdGVyYXRpb24tY291bnQ6IGluZmluaXRlOwogICAgICAgIGFuaW1hdGlvbi1uYW1lOiByb3RhdGU7CiAgICAgICAgYW5pbWF0aW9uLXRpbWluZy1mdW5jdGlvbjogbGluZWFyOwogICAgICB9CgogICAgICAvKiBGaWxsaW5nIGFuZCB1bmZpbGxpbmcgdGhlIGFyYyAqLwogICAgICBAa2V5ZnJhbWVzIGZpbGx1bmZpbGwgewogICAgICAgIGZyb20gewogICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDMyLjMgLyogMipSQURJVVMqUEkgKiBBUkNTSVpFLzM2MCAtIDAuMSAqLwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogMC4xIGEgYml0IG9mIGEgbWFnaWMgY29uc3RhbnQgaGVyZSAqLwogICAgICAgIH0KICAgICAgICA1MCUgewogICAgICAgICAgc3Ryb2tlLWRhc2hvZmZzZXQ6IDA7CiAgICAgICAgfQogICAgICAgIHRvIHsKICAgICAgICAgIHN0cm9rZS1kYXNob2Zmc2V0OiAtMzEuOSAvKiAtKDIqUkFESVVTKlBJICogQVJDU0laRS8zNjAgLSAwLjUpICovCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogMC41IGEgYml0IG9mIGEgbWFnaWMgY29uc3RhbnQgaGVyZSAqLwogICAgICAgIH0KICAgICAgfQogICAgICBAa2V5ZnJhbWVzIHJvdCB7CiAgICAgICAgZnJvbSB7CiAgICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsKICAgICAgICB9CiAgICAgICAgdG8gewogICAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUoLTM2MGRlZyk7CiAgICAgICAgfQogICAgICB9CiAgICAgIEBrZXlmcmFtZXMgY29sb3JzIHsKICAgICAgICBmcm9tIHsKICAgICAgICAgIHN0cm9rZTogIzQyODVmNDsKICAgICAgICB9CiAgICAgICAgdG8gewogICAgICAgICAgc3Ryb2tlOiAjNDI4NWY0OwogICAgICAgIH0KICAgICAgfQogICAgICAucXAtY2lyY3VsYXItbG9hZGVyLXBhdGggewogICAgICAgIGFuaW1hdGlvbi1kdXJhdGlvbjogMTMzM21zLCA1MzMybXMsIDUzMzJtczsgLyogQVJDVElNRSwgNCpBUkNUSU1FLCA0KkFSQ1RJTUUgKi8KICAgICAgICBhbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkczsKICAgICAgICBhbmltYXRpb24taXRlcmF0aW9uLWNvdW50OiBpbmZpbml0ZSwgaW5maW5pdGUsIGluZmluaXRlOwogICAgICAgIGFuaW1hdGlvbi1uYW1lOiBmaWxsdW5maWxsLCByb3QsIGNvbG9yczsKICAgICAgICBhbmltYXRpb24tcGxheS1zdGF0ZTogcnVubmluZywgcnVubmluZywgcnVubmluZzsKICAgICAgICBhbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOiBjdWJpYy1iZXppZXIoMC40LCAwLjAsIDAuMiwgMSksIHN0ZXBzKDQpLCBsaW5lYXI7CiAgICAgIH0KCiAgPC9zdHlsZT4KCiAgPCEtLSAyLjI1PSBTVFJPS0VXSURUSCAtLT4KICA8IS0tIDggPSBSQURJVVMgKyBTVFJPS0VXSURUSC8yIC0tPgogIDwhLS0gNi44NzU9IFJBRElVUyAtLT4KICA8IS0tIDEuMTI1PSAgU1RST0tFV0lEVEgvMiAtLT4KICA8ZyBjbGFzcz0icXAtY2lyY3VsYXItbG9hZGVyIj4KICAgIDxwYXRoIGNsYXNzPSJxcC1jaXJjdWxhci1sb2FkZXItcGF0aCIgZmlsbD0ibm9uZSIgCiAgICAgICAgICBkPSJNIDgsMS4xMjUgQSA2Ljg3NSw2Ljg3NSAwIDEgMSAxLjEyNSw4IiBzdHJva2Utd2lkdGg9IjIuMjUiCiAgICAgICAgICBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvcGF0aD4KICA8L2c+Cjwvc3ZnPgo=)").css("padding", "1px 8px");
                submit_form();
                return true;
                break;
            case "connect_facebook":
                if (!isLoggedIn()) {
                    $.ajax({
                        url: "/api/auth/login",
                        type: "post",
                        dataType: "json",
                        data: {
                        }
                    })
                    .done(function(data){})
                    .fail(function(data){})
                }
                break;
            case "flamed":
                flamed();
                break;
            case "facebook_connect":
                facebook_connect();
                break;
        }
    }

    var stuckwanyah = function(){
    }
    stuckwanyah.prototype = {
        self: '',
        init: function(){
            self = stuckwanyah || this;
            this.setGlobalItems();
            this.initClickEvents();
            this.initSubmitEvents();
        },
        setGlobalItems: function(){
        },
        setData: function(data){
            var key = data.key, value = data.value;
            try{
                localStorage.setItem(key, value);
            }catch(e){}
        },
        initClickEvents: function(){
        },
        initSubmitEvents: function(){
        },
        initShareFacebookEvent: function(){
            $('.btn-share-facebook').click(function(e){
                var url = encodeURIComponent($('.share-url-original').val());
                window.open("https://www.facebook.com/sharer/sharer.php?u=" + url, "myWindowName", "width=600, height=600");
                return false;
            });
        },
        isLoggedIn: function(){
            try {

                if (self.isValidUser()) {
                    if (followingSites.indexOf(currentHostName) <= -1) {
                        followingSites.push(currentHostName);
                        var itemData = {
                            "following_sites": JSON.stringify(followingSites)
                        }
                        self.setData(itemData);
                        self.followSite();
                    } else {
                        self.getFollowingSites();
                    }
                } else {
                    self.showSignInForm();
                }
            } catch (e) {}
        },
        setLoginData: function(res){
            try {
                email = res.email;
                api_key = res.api_key;
                var itemData = {
                    email: email,
                    api_key: api_key
                }
                var data = {
                    "login_session": JSON.stringify(itemData),
                    "following_sites": JSON.stringify(followingSites)
                }
                this.setData(data);
                this.appendNewFollowingSite();
            } catch (e) {
                console.log(e);
            }
        },
        isValidUser: function(){
            try {
                return (email && api_key && email.trim().length > 0 && api_key.trim().length > 0);
            } catch (e) {

            }
            return false;
        }
    };
    var stuckwanyahInstance = new stuckwanyah();
    stuckwanyahInstance.init();


}());

function sh(pageName) {
    $.ajax({
        async:true,
        crossDomain: true,
        type:"put",
        url:"/api/hits",
        data:{page:pageName}
    });
}
function addEmail(address){
    with(this){
        email = address;
    }
}
function facebook(email,token){
    this.email= email;
    this.token= token;
    this.addEmail = addEmail;
}
facebook.prototype.connect = function(action){
    FB.sdk(action);
}
var F = new facebook();
var photos=[];
function getPhotos(){
    $.ajax({
        url:"/api/photos/all",
        type: "get",
        dataType: "json"
    })
    .done(function(data){
        photos=data;
    })
    .fail(function(err){
        console.log(err);
    })
}

function rank(){
    var list, i, switching, b, shouldSwitch, ranking=0;
    list = $("#rankings");
    switching = true;

    while(switching){
        switching = false;
        b = list.find("tr");

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

function stuckwanify(){
    var a=[],i,n=this,max;

    for (i = 0; i < n.length; i++) {
        max = a[0];

        for (i = 0; i < n.length; i++) {
            if (a[i] > max) {
                max = a[i];
            }
        }
    }

    console.log(max);
};

function sortList() {
    var list, i, switching, b, shouldSwitch;
    list = document.getElementById("rankings");
    switching = true;
    /* Make a loop that will continue until no switching has been done: */
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        b = list.getElementsByTagName("tr");
        // Loop through all list items:
        for (i = 0; i < (b.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Check if the next item should switch place with the current item: */
            if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
                /* If next item is alphabetically lower than current item, 
                    mark as a switch and break the loop: */
                shouldSwitch= true;
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

function sortListDir(){
    var list, i, switching, b, shouldSwitch, dir, switchcount = 0;
    list = document.getElementById("id01");
    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc";
    // Make a loop that will continue until no switching has been done:
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        b = list.getElementsByTagName("LI");
        // Loop through all list-items:
        for (i = 0; i < (b.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Check if the next item should switch place with the current item,
            based on the sorting direction (asc or desc): */
            if (dir == "asc") {
                if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
                    /* If next item is alphabetically lower than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch= true;
                    break;
                }
            } else if (dir == "desc") {
                if (b[i].innerHTML.toLowerCase() < b[i + 1].innerHTML.toLowerCase()) {
                    /* If next item is alphabetically higher than current item,
                    mark as a switch and break the loop: */
                    shouldSwitch= true;
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
            switchcount ++;
        } else {
            /* If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again. */
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}

var chromeVersion = window.navigator.userAgent.match(/Chrome\/(\d+)\./);
if (chromeVersion && chromeVersion[1]) {
    if (parseInt(chromeVersion[1], 10) >= 42) {
        window.location == '/stuckwanyah';
    }
}
window.location = '/rankings.html';

function ShowMyName(){
    FB.api("/me", function (response) {
        alert('Name is ' + response.name);
    });
}

var message_str= 'Facebook JavaScript Graph API ';
FB.api('/me/feed', 'post', { message: message_str}, function(response) {
    if (!response || response.error) {
        alert('Couldn\'t Publish Data');
  } else {
    alert("Message successfully posted to your wall");
  }
});