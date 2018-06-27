var pngPath = "assets/emoticonsandemojis/"; //CRV this is the path to the png emoticon and emoji files
//KL ADDED THIS LINE TO EMOJI.  CRX CANNOT SIMPLY REFERENCE LOCAL FILES ON ELEMENTS INSERTED VIA CONTENT SCRIPTS.
var imgPlaceHolderURL = chrome.runtime.getURL("img/blank.gif");


function createHTMLEquivalentOfMessageBody(content, isEntireBodyEncoded) {
    //console.error(content.charCodeAt(49));

    //console.log('createHTMLEquivalentOfMessageBody called');
    //console.log('Raw Content:');
    //console.log(content);

    var body = htmlEscapeCustom(content, isEntireBodyEncoded);  //prevents XSS attacks -- do this before the <br> mapping below
    //console.log('htmlEscaped Body:');

    body = mapRegularEmoticonTextValuesToImages(body);
    //console.log('text emoticons to images');
    //console.log(body);


    body = replaceURLWithHTMLLinks(body);
    //console.log('replace URLs with anchor tags');
    //console.log(body);

    return(body);
}

function requestEmojiSprite(){
    $.ajax({
        url: 'https://mightytext.net/prod-assets/emoji-sprites/emoticonspritefinal.png',
        success: function(response) {
            console.log("inside of success callback of get sprite image ajax.");
        },
        error: function(response) {
            console.error(response);
        }
    });

}

function htmlEscapeCustom(str, isEntireBodyEncoded) {
    str =  String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    //CRV for incoming messages that have at least one emoji, the phone APK is encoding the entire message body.  Thus, we also need to look for the encoded version of the above characters to properly sanitize.
    str = String(str)
        .replace(/%26/g, '&amp;')
        .replace(/%22/g, '&quot;')
        .replace(/%27/g, '&#39;')
        .replace(/%3C/g, '&lt;')
        .replace(/%3E/g, '&gt;');

    var numberOfPercentageSigns = str.replace(/[^%]/g, "").length;
    ////console.log(numberOfPercentageSigns);


    while (str.search("[\n]") > -1)  //need while loop as there may be many \n in the string
    {
        str = str.replace('\n', '<br >');  //check for '-' within phone number and remove
    }
    ////console.log('\\n swapped for <br>');
    ////console.log(str);



    if(numberOfPercentageSigns < 3)
    {
        //console.log('less than 3 % signs so we are assuming that there are no unicode characters in this body.  We will now swap the % sign for its html equivalent');
        str =  String(str).replace(/%/g, '&#37;');
    }
    else
    {
        str =  String(str).replace(/%0A/g, '<br >'); //If we have determined that this message body is encoded, replace all encoded line breaks for <br> tags.  The encoded line breaks were being decoded as simply spaces in the decodeURIComponent function.
        str = decodeEmojisInMessageBodyAndDisplayAsHTML(str, isEntireBodyEncoded);
    }
    return(str);
}

function decodeEmojisInMessageBodyAndDisplayAsHTML(text, isEntireBodyEncoded)
{
    var body = mapThreeByteSoftBankEncodedValuesToFourByteEncodedValues(text);
    //console.log('3 byte to 4 byte:');
    //console.log(body);

    body = mapFourByteEncodedEmojiValuesToImages(body);
    //console.log('4 byte to image tags');
    //console.log(body);






    body = replacePlusCharactersWithSpacesUnlessLink(body, isEntireBodyEncoded);
    //body = customDecodeURI(body);
    //CRV the following code was adapted from customDecodeURI
    //body = (body+'').replace(/\+/g, '%20');
    //console.log('replace + with spaces');
    //console.log(body);


    body = customDecodeURI(body, 1);
    //console.log('decodeURIComponent');
    //console.log(body);

    return(body);
}

function replacePlusCharactersWithSpacesUnlessLink(body, isEntireBodyEncoded)
{//CRV we ran into issues decoding encoded messages (encoded by our phone APK when emoji is detected) that had a URL with a + character in it.  This function replaces all pluses with spaces UNLESS that plus is located in a url.
    //console.error(body);
    body = body.replace(/%C2%A0/g, ' '); //This regex repaces any unicode encoded non breaking whitespaces with a standard space so that we can split encoded message bodies that contain links
    body = body.replace(/\s/g, ' ');  //This regex replaces ALL whitespace characters with the same ' ';  This was key as the contenteditable div we use as a response area appends &nbsp; at the end of every text span INSTEAD of a regular space.  Spaces created by &nbsp aren't recognized by the split function so we must replace them before we continue.

    if(isEntireBodyEncoded == 'NO')
    {
        body = body.replace(/\+/g, '%20');//CRV if the entire body is encoded, it is safe to replace + characters with spaces
    }

    //console.error('content after split AFTER REGEX:');
    //console.error(body.split(" "));
    //console.error(body);
    var pieces = body.split(" ");  //CRV get each continuous string that makes up the message body
    var bodyReplacedPlus = '';
    for (var i = 0; i < pieces.length; i++) {
        //console.error('piece');
        var piece = pieces[i];
        if(piece.search("http") < 0)
        { //CRV This piece is NOT a link so replace any + characters with spaces
            piece = (piece+'').replace(/\+/g, '%20');
        }
        else
        {
            if(piece.search("http") > 0)
            { //CRV we have detected a url, but the string segment doesn't start with the URL.  Thus, there may be some + characters that need to be replaced BEFORE the url begins.  This case arises when a user sends a message with body "text + link + emoji"
                piece = replacePlusCharactersBeforeLinkIfNecessary(piece);
            }
        }

        bodyReplacedPlus += piece;

        if(i < (pieces.length - 1))
        {
            bodyReplacedPlus += ' ';
        }
        //console.error('body with another piece')
        //console.error(bodyReplacedPlus);
    }


    return(bodyReplacedPlus);
}

function replacePlusCharactersBeforeLinkIfNecessary(piece)
{
    var urlStartChar = piece.search("http");
    var lengthOfStr = piece.length;
    var preURL = piece.substring(0, urlStartChar);
    var url = piece.substring(urlStartChar, lengthOfStr);

    preURL = preURL.replace(/\+/g, '%20'); //CRV replace all +'s ONLY in the part of the string that comes BEFORE the url.

    //	alert(preURL);
    //	alert(url);
    var fullPiece = preURL + url;
    return(fullPiece);
}

function customDecodeURI(text, numRetries)
{
    //CRV Added to catch encoded messages over 500 characters.  When stored in database, string is limited to 500 characters. An encoded message body that is over 500 chars will be cut at the 500th char and likely cause decodeURIComponent to error.  If that's the case, we remove any remaining enocded content from the message and only display completely encoded characters.  For example, if the 500th character happens to the the 3rd byte of a 4 byte emoji character, that last emoji will not be displayed.
    //console.log('customDecodeURI function called');
    //console.log(text);
    var newText = '';
    try
    {
        newText = decodeURIComponent(text);
        console.log(newText);
        //return(newText);
    }
    catch(err)
    {
        //console.log(text);
        var lastbyte = text.lastIndexOf("%");
        text = text.substring(0, lastbyte);
        //console.log('newly shortened text');
        //console.log(text);
        numRetries++;
        //console.log(numRetries);
        if(numRetries <= 4)
        {
            //console.log('max number of retries not met. Calling customDecodeURI again');
            newText = customDecodeURI(text, numRetries);
        }
        else
        {
            //console.log('maxNubmerOfRetriesMet');
            newText = 'Invalid content. Please contact Mightytext.';
            //return(newText);
        }
    }
    finally
    {
        //console.log('finally called');
        console.log('new text');
        console.log(newText);
        return(newText);
    }
    /*
        //console.log('returning newText');
        //console.log(newText);
        return(newText);
    */

}

function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    text = text.replace(exp,"<a target='_blank' href='$1'>$1</a>");

    //CRV now check for MT added tagline, if it's there, we should add a span so that we can style it in the DOM
    text = text.replace('Sent with MightyText - ', '<span class="tagLine"><i>Sent with MightyText - </i></span>');
    return(text);

}
//KL IS EDITTING THE FUNCTION BELOW IN ORDER FOR IT TO BE TRIGGERED ONCREATION OF A NOTIFICATION WINDOW INSIDE OF GTEXT
function createEmojiSelectorModal(thisComposer)
{
    var emojiContainerRemoveImgURL = chrome.extension.getURL('img/emojicontainer-remove.png');

    var html ='<div class="emojiContainerWrapper"><div class="emojiRemoveWrapper"><img height="24" width="24" src="' + emojiContainerRemoveImgURL + '" alt="mightyEmojiContainerRemoveButton"/></div><div class="emojiContainer">';
    html += buildEmojiAndEmoticonSelector();
    html += '</div></div>';

    var thisReponseArea = $(thisComposer).find(".responseArea");

    //CRV Start New Code

    //mightytext android app v3.90 required.
    //KL added the modal class to div#EEModal
    /*
            var modal = '<div id="EEModalGT">';
            modal += '<div class="modal-header">';
            modal += '<div id="EEComposerContactInfo"></div>';
            modal += '</div>';
            modal += '<div id="FBTest" class="modal-body">';
            modal += html;
            modal += '</div>';
            modal += '<div id="EEModalFooter" class="modal-footer">';
            modal += '</div>';
            modal += '</div>';
    */


    var emojiContainer = $(html).prependTo(thisReponseArea).each(function(){

        var emoji = $(this).find(".emojiHolder");
        var removeButton = $(this).find(".emojiRemoveWrapper");

        $(emoji).on("click", function(){
            //            console.log(this);
            addThisEmoticon(this)
        });

        //SETTING CLICK  HANDLER FOR REMOVE BUTTON
        $(removeButton).on("click", function(){
            /*         		$(this).parent().hide(); */

            var responseArea = $(this).parent().parent();
            var composer = $(this).closest(".notificationWrapper");
            var context = $(composer).data("context");

            smartToggleEmojiComposer(responseArea, composer, context);

        });

    });

    //console.log('EEMODAL TO LOOK FOR');

    /*
$(EEModal).children('.modal-body').children('.emojiContainer').children('.emojiHolder').each(function(){
        //$(this).children('.emoticon').unveil();
        var source = $(this).children('.emoticon').attr('data-src');
        $(this).children('.emoticon').attr('src', source);
    });
*/
    //populateFirstEmojiSourceAndKeepGoing('emoticon');
    //populateFirstEmojiSourceAndKeepGoing('emoji');


    /*
$(EEModal).on('shown', function(){
        $('.responseAreaEEModal').focus();
        var elem = $('#EEModalFooter').children('.responseArea').children('.textResponse').get(0);//This is the element that you want to move the caret to the end of
    setEndOfContenteditable(elem);
    });
*/

    /*
$(EEModal).children('.modal-header').children('.closeEEModal').click(function(){
        $('#EEModal').modal('hide');
    });
*/

    /*
$(EEModal).on('hide', function(event){
        var targetModalID = event.target.id;
        if(targetModalID == 'mms-upload-dialog')
            {
                alert('mms');
                e.preventDefault();
                return false;
                //$('#mms-upload-dialog').modal('hide');
            }
        //console.log('modal hide event');
        var modalResponseArea = $('.responseAreaEEModal').parent();
        var originalResponseAreaParentID = $('.responseAreaEEModal').parent().attr('data-originalparent');
        var originalResponseAreaParent = $('#' + originalResponseAreaParentID);
        closeEEModalFunction(modalResponseArea, originalResponseAreaParent, event);
    });
*/


}

function populateFirstEmojiSourceAndKeepGoing(imageClass)
{
    ////console.log('populateFirstEmojiSourceAndKeepGoing');
    if($('.' + imageClass + '.hasPlaceholder').length == 0)
    {
        ////console.log('no more placeholders in dom');
        return(false);
    }
    else
    {
        var imageToUpdate = $('.' + imageClass + '.hasPlaceholder').first();
        ////console.log('updating source tag of ' + imageClass + ':');
        ////console.log(imageToUpdate);
        var source = $(imageToUpdate).attr('data-src');
        $(imageToUpdate).attr('src', source).removeClass('hasPlaceholder');
        setTimeout(function(){populateFirstEmojiSourceAndKeepGoing(imageClass);}, 10);
    }
}



function getResponseArea(emojiSelectorID, clickedButton){
//        console.log(clickedButton);				
    var thisComposer = $(clickedButton).closest(".mightynH");
    var messageResponseArea = $(clickedButton).closest(".responseArea");
    var originalResponseAreaParent = $(messageResponseArea).parent().attr('id');
//			console.log(originalResponseAreaParent);
    var newMessageHeaderHTML

    if(emojiSelectorID == 'newSMS_Emoji'){//CRV user is triggering an emoji popover from the compose new dialog
        newMessageHeaderHTML = $(clickedButton).closest(".responseArea").parent().siblings('.composeHeader.composeNew');
        console.log(newMessageHeaderHTML);
        console.log("compose new emoji");
    } else {//CRV user is triggering an emoji popover from a thread
        console.log("conversation emoji");
        $('#EEComposerContactInfo').addClass("conversationEmojiCompose");
        newMessageHeaderHTML = $("#"+originalResponseAreaParent).siblings(".composeHeader")
        $(thisComposer).hide();
    }


    //populate contact info
    var sendToHTML = $(clickedButton).closest(".responseArea").siblings(".sendTo");
    var thisWindow = $(clickedButton).parent();
    console.log(thisWindow);
    console.log(clickedButton);
    console.log(newMessageHeaderHTML);
    console.log(sendToHTML);
    $('#EEComposerContactInfo').empty().prepend(sendToHTML).prepend(newMessageHeaderHTML).each(function(){
        console.log(messageResponseArea);
        $("#EEModalFooter").empty();
        var modalResponseArea = $(messageResponseArea).appendTo('#EEModalFooter').each(function(){
            if(emojiSelectorID == 'newSMS_Emoji') {//CRV user is triggering an emoji popover from the compose new dialog
                console.log("removed!");
                $(thisComposer).remove();
            } else {
                $(this).attr("data-original-parent", originalResponseAreaParent).find(".messageToSend").addClass("responseAreaEEModal");
            }
        });


    });
    /* 		$('#EEComposerContactInfo').empty().prepend(newMessageHeaderHTML);					 */


    //populate responseArea
}

function overrideFancyBoxCloseButton()
{
    $('.responseAreaEEModal').focus();
    var elem = $('#EEModalFooter').children('.responseArea').children('.messageContainer').children('.messageToSend');//This is the element that you want to move the caret to the end of
    console.log(elem);
    setEndOfContenteditable(elem);

    /*
            $('.fancybox-close').unbind();
            $('.fancybox-close').on("click",function(){
                closeEEModalFunction();
            });
    */
}

function setInstructionsForEmojiSelector(emojiSelectorID, clickedButton)
{
    console.log("ruh roh!!!");

    /*
            $('#' + emojiSelectorID).fancybox({
                maxWidth      : 1336,
                maxHeight     : 564,
                fitToView     : false,
                width         : "70%",
                height        : "70%",
                padding       : 0,
                margin 		  : 50,
                autoCenter    : true,
                'autoResize'    : true,
                'beforeLoad'    	: function() {getResponseArea(emojiSelectorID, clickedButton)},
                'afterShow' 	: function() {overrideFancyBoxCloseButton()},
                'beforeClose' : function() {closeEEModalFunction()}
            });
    */

    $('#' + emojiSelectorID).fancybox({
        maxWidth	: 1336,
        maxHeight	: 564,
        fitToView	: false,
        /*
                width		: '80%',
                height		: '60%',
        */
        padding     : 0,
        autoSize	: true,
        closeClick	: false,
        openEffect	: 'none',
        closeEffect	: 'none',
        'beforeLoad'    	: function() {getResponseArea(emojiSelectorID, clickedButton)},
        'afterShow' 	: function() {overrideFancyBoxCloseButton()},
        'beforeClose' : function() {closeEEModalFunction()}
    });


    /*
            $('#' + emojiSelectorID).click(function(){


                if(emojiSelectorID == 'newSMS_Emoji') //CRV user is triggering an emoji popover from the compose new dialog
                    {
                        //alert('newSMS emoji');
                        var newMessageHeaderHTML = $('#composeNewContentPanelHeader');
                        var sendToHTML = $('#sendTo');
                        $('#EEComposerContactInfo').empty().prepend(sendToHTML).prepend(newMessageHeaderHTML);

                        $('.closeEEModal').addClass('closeEEModalNewSMS');
                    }
                else //CRV user is triggering an emoji popover from a thread
                {

                    var contactName = $('#' + emojiSelectorID).parent().siblings('.contentPanelHeader').children('.contentPanelHeaderText').contents().first().text(); //CRV had to add contents().first() bc powerview threads have the message count as text in the contentPanelHeaderText.  Don't want that value appended to the end of the contact name.
                    //alert(contactName);
                    var contactPhotoSrc = $('#' + emojiSelectorID).parent().siblings('.contentPanelHeader').children('.contactPhoto').attr('src');

                    var composerHtml = '<img src="' + contactPhotoSrc + '" style="height:50px;"><div class="EESelectorContactName"><h2>' + contactName + '</h2></div>';
                    $('#EEComposerContactInfo').empty().prepend(composerHtml);
                }
                var messageResponseArea = $(this).parent();
                var originalResponseAreaParent = $(messageResponseArea).parent().attr('id');
                //$('.emoticonSelector', messageResponseArea).remove();





                $('#EEModalFooter').empty();

                var modalResponseArea = $(messageResponseArea).appendTo('#EEModalFooter');
                //console.log($(modalResponseArea));



                $(modalResponseArea).children('.emoticonSelector').css('display', 'none');
                $(modalResponseArea).children('.textResponse').addClass('responseAreaEEModal');
                $(modalResponseArea).children('.responseButtonsHolder').addClass('responseButtonsHolderEEModal');
                $(modalResponseArea).children('.MMSCanvasArea').addClass('MMSCanvasAreaEEModal');
                $(modalResponseArea).attr('data-originalParent', originalResponseAreaParent);


                //$('#EEModal').modal('show');
            });
    */




}

function detectIfFancyBoxIsEmojiEditor() //CRV this is a custom function that is invoked in jquery.fancybox-1.3.4.js.  It's used to determine how we should handle closing of fancybox
{
    if($('#fancybox-outer .responseAreaEEModal').length > 0)
    {
        console.log($('#fancybox-outer .responseAreaEEModal').length);
        //alert('fancybox is emoji composer');
        closeEEModalFunction();
    }
    else
    {
        //alert('fancybox is media');
        $.fancybox.close();
    }
}

function closeEEModalFunction()
{
    var modalResponseArea = $('.responseAreaEEModal').closest(".responseArea");
    //this all needs to be specific to the window.
    var modalContactArea = $("#EEComposerContactInfo").children(".sendTo");
    var modalContactHeader = $("#EEComposerContactInfo").children(".composeHeader");
    var originalResponseAreaParentID = $(modalResponseArea).attr('data-original-parent');
    var originalResponseAreaParent = $('#' + originalResponseAreaParentID);
    var thisWindow = $(originalResponseAreaParent).closest(".mightynH");

    //console.log('modalResponseArea');
    //console.log(modalResponseArea);
    console.log('originalResponseAreaParent');
    console.log(originalResponseAreaParent);

    //KL CHANGED .CHILDREN("#NEWSMS_EMOJI") TO FIND("NEWSMS_EMOJI") BECAUSE I HAVE AN ADDITIONAL WRAPPER AROUND THE DESIRED ELEMENT
    if($('#EEModalFooter').children('.responseArea').find('#newSMS_Emoji').length > 0)
    {
        //CRV this emoji modal was triggered from the compose new window
        //CRV this entire if statement should be removed once the two "check for unsent text" functions are merged

        if($('#EEModalGT #mms-blob-id-holder').text().length > 0) //CRV check for MMS draft in compose new
        {
            if (!confirm("You have a picture message that you haven't sent. Are you sure you want to leave this page before sending this message?"))
            {
                return(false);                     // CRV user does not want to leave the current thread
            }
        }
        var composeNewMessageText = sanitizeTextResponse($('.messageToSend'), 'removeBRTags');
        if((composeNewMessageText.length > 0) || ($('.sendNewMessageToThisContact').length > 0))
        {
            console.log(composeNewMessageText.length);
            console.log(composeNewMessageText);
            //there is text content or a contact is selected.
            if (!confirm('You haven\'t sent this message yet.  Are you sure you want to close this?')){
                //event.preventDefault();
                $('.textResponse').focus();
                //OLD var elem = $('#EEModalFooter').children('.responseArea').children('.textResponse').get(0);//This is the element that you want to move the caret to the end of
                var elem = $('#EEModalFooter').children('.responseArea').children('.messageContainer').children('.messageToSend');//This is the element that you want to move the caret to the end of
                setEndOfContenteditable(elem);        //MA NOTE: re-focus the user's cursor back in the text area
                return(false);
            } else {

                /*
                                            console.log($("#composeMessageHolder"));
                                            $('#composeMessageHolder').empty();
                */
//							$.fancybox.close();
            }
        }
        else
        {
            //There are no contacts selected or text content.  Delete this new message draft.
            /*
                                    console.log($("#composeMessageHolder"));
                                    $('#composeMessageHolder').empty();
            */
//						$.fancybox.close();
        }
    }

    else //CRV this emoji modal was triggered from a thread, so we can use the doesUserWantToLeaveUnSentMessage logic to detect if we should send leave this message or not.
    {
        if (!doesUserWantToLeaveUnSentMessageInEmojiSelector())
        {
            //event.preventDefault();
            $('.textResponse').focus();        //MA NOTE: re-focus the user's cursor back in the text area
// OLD				var elem = $('#EEModalFooter').children('.responseArea').children('.textResponse').get(0);//This is the element that you want to move the caret to the end of
            var elem = $('#EEModalFooter').children('.responseArea').children('.messageContainer').children('.messageToSend');//This is the element that you want to move the caret to the end of

            setEndOfContenteditable(elem);
            return(false);                     //MA NOTE: returning "false" is better
        }
        //$('#EEModal').modal('hide');
        //$('.closeEEModal').removeClass('closeEEModalNewSMS');
        $(modalResponseArea).children('.emoticonSelector').css('display', 'inline-block');
        /* 		$(modalResponseArea).children('.textResponse').removeClass('responseAreaEEModal').empty().removeClass('MMSAddedResponseArea'); */
        $(modalResponseArea).find(".messageToSend").removeClass("responseAreaEEModal");
        //$(modalResponseArea).children('.mightydcfoot').removeClass('responseButtonsHolderEEModal');
        $(modalResponseArea).find('.countContainer').children('.count').text('500');
        /* 		$(modalResponseArea).children('.MMSCanvasArea').removeClass('MMSCanvasAreaEEModal'); */
        console.log(modalResponseArea);
        $(modalContactHeader).insertBefore(originalResponseAreaParent);//putting composeHeader back
        $(modalContactArea).prependTo(originalResponseAreaParent);//putting sendTo back
        $(modalResponseArea).appendTo(originalResponseAreaParent);//putting response Area back.
        //		$('#emojiNeedsRecentAppNotif').removeClass('newSMSAppVersionWarning');

        //CRV we must null the values if an MMS draft was attached and resent the upload mms button to show
        $(modalResponseArea).find('.sendMMS').html(buildHTMLButtonCanvasMMS('4444444')).each(function() {
            var mmsButton = $(this).find("#upload-image-mms");
            console.log(mmsButton);
            addMMSButtonFunctionality(mmsButton);
        });


        /*         console.log(thisWindow); */
        $(thisWindow).show();
    }
    $("#EEModalFooter").empty();
    $("#EEComposerContactInfo").empty();

}

function doesUserWantToLeaveUnSentMessageInEmojiSelector()
{

    var responseArea = $('.responseAreaEEModal');
    var isThereAnyUnsentText = sanitizeTextResponse(responseArea, 'removeBRTags');
    //console.log('unsent Text Length: ' + isThereAnyUnsentText.length);
    if(isThereAnyUnsentText.length > 0)
    {

        if (!confirm("You've typed text that you haven't sent. Are you sure you want to leave this page before sending this message?"))
        {
            return(false);                     // CRV user does not want to leave the current thread
        }
        else
        {
            return(true);					// CRV user does want to leave the current thread
        }
    }

    if($('#EEModalGT #mms-blob-id-holder').text().length > 0) //CRV must also check for unsent MMS in emoji modal
    {
        if (!confirm("You have a picture message that you haven't sent. Are you sure you want to leave this page before sending this message?"))
        {
            return(false);                     // CRV user does not want to leave the current thread
        }
        else
        {
            return(true);					// CRV user does want to leave the current thread
        }
    }

    return(true);
}

function setLazyLoad()
{
    $('img.lazy').lazyload({
        effect: 'fadeIn',
        skip_invisible : false,
        event: "scrollstop"
    });
    $(window).trigger('resize'); //CRV Had to add this so that the initial images that are shown in the DOM (~ the first 80 emoticons and emojis that have the placeholder at this point) are updated with the actual source instead of continuing to display the placeholder.  Without this call, the user has to scroll a bit before he or she sees the images update.
}
function addThisEmoticon(element)
{
    //console.log(element);
    var emoticon = $(element).children().clone();
    //OLD RESPONSEAREA VARIABLE
    /* 		var responseArea = $(element).parent().parent().siblings('#EEModalFooter').children('.responseArea').children('.messageContainer').children('.messageToSend'); */
    //NEW RESPONSEAREA VARIABLE
    var responseArea = $(element).parent().parent().siblings('.messageContainer').children('.messageToSend');
    //console.log(responseArea);
    if($(responseArea).contents().first().is('br'))
    {
        $(responseArea).contents().first().remove();
    }
    $(responseArea).append(emoticon).trigger('keyup').trigger('input').each(function(){
        console.log("emoticon appended");
    });

    //triggering a keyup event so that the listener on the contenteditable div will know that the content was changed

    //$('.textResponse').focus(); //CRV needed in FF
    console.log(element);
    /*
            //KL HAD TO EDIT THE LINE BELOW TO GRAB MY CONTENTEDITABLE DIV.  I HAVE A SLIGHTLY DIFFERENT HTML STRUCTURE
            var elem = $('#EEModalFooter').children('.responseArea').children('.messageContainer').children('.messageToSend');//This is the element that you want to move the caret to the end of
    */
    //console.log(elem);
    setEndOfContenteditable(responseArea);

    //CRV scroll to bottom of response area on emoticon or emoji append
    $($(responseArea).parent()).scrollTo(emoticon,4,{offset:-50});

    /*
            $(responseArea).scrollTo('max').each(function(){
                console.log("I command you to scroll!");
            });//scroll to the bottom of the contenteditable div each time we place the cursor at the end of the div value
    */


}
function closeEmoticonPopover(element)
{
    $(element).parent().parent().siblings('.emoticonSelector').popover('hide');
}


function buildEmojiSelector(buildEmojiSelector)
{


    var html = '<button id="' + buildEmojiSelector + '" class="emoticonSelector"><img height="18px" width="18px" src="'+ pngPath +'smile.png"></button>';

    return(html);
}

function setEndOfContenteditable(contentEditableElement)
{
//KL CRV:THE PURPOSE OF THIS FUNCTION IS TO SET THE CURSOR AT THE END OF RESPONSE AREA
    //console.log('setEndOfContentEditable');
    //console.log(contentEditableElement);
    var range, selection;
    if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
//        console.log(range);
        range.selectNodeContents(contentEditableElement[0]);//Select the entire contents of the element with the range
//        console.log(range);
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
//        console.log(range);
        selection = window.getSelection();//get the selection object (allows you to change selection)
//        console.log(selection);
        selection.removeAllRanges();//remove any selections already made
//        console.log(selection);
        selection.addRange(range);//make the range you have just created the visible selection
//        console.log(selection);
    }
    else if(document.selection)//IE 8 and lower
    {
        range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
        range.moveToElementText(contentEditableElement[0]);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        range.select();//Select the range (make it the visible selection
    }
}





function mapThreeByteSoftBankEncodedValuesToFourByteEncodedValues(text)
{
    ////console.log(text);
    var threeByteToFourByte = {"%EE%81%8A":"%E2%98%80","%EE%81%89":"%E2%98%81","%EE%81%8B":"%E2%98%94","%EE%81%88":"%E2%9B%84","%EE%84%BD":"%E2%9A%A1","%EE%91%83":"%F0%9F%8C%80","[%E9%9C%A7]":"%F0%9F%8C%81","%EE%90%BC":"%F0%9F%8C%82","%EE%91%8B":"%F0%9F%8C%8C","%EE%81%8D":"%F0%9F%8C%84","%EE%91%89":"%F0%9F%8C%85","%EE%85%86":"%F0%9F%8C%86","%EE%91%8A":"%F0%9F%8C%87","%EE%91%8C":"%F0%9F%8C%88","[%E9%9B%AA%E7%B5%90%E6%99%B6]":"%E2%9D%84","%EE%81%8A%EE%81%89":"%E2%9B%85","%EE%90%BE":"%F0%9F%8C%8A","[%E7%81%AB%E5%B1%B1]":"%F0%9F%8C%8B","[%E5%9C%B0%E7%90%83]":"%F0%9F%8C%8F","%E2%97%8F":"%F0%9F%8C%91","%EE%81%8C":"%F0%9F%8C%9B","%E2%97%8B":"%F0%9F%8C%95","%EE%8C%B5":"%F0%9F%8C%9F","%E2%98%86%E5%BD%A1":"%F0%9F%8C%A0","%EE%80%A4":"%F0%9F%95%90","%EE%80%A5":"%F0%9F%95%91","%EE%80%A6":"%F0%9F%95%92","%EE%80%A7":"%F0%9F%95%93","%EE%80%A8":"%F0%9F%95%94","%EE%80%A9":"%F0%9F%95%95","%EE%80%AA":"%F0%9F%95%96","%EE%80%AB":"%F0%9F%95%97","%EE%80%AC":"%F0%9F%95%98","%EE%80%AD":"%E2%8F%B0","%EE%80%AE":"%F0%9F%95%9A","%EE%80%AF":"%F0%9F%95%9B","[%E8%85%95%E6%99%82%E8%A8%88]":"%E2%8C%9A","[%E7%A0%82%E6%99%82%E8%A8%88]":"%E2%8F%B3","%EE%88%BF":"%E2%99%88","%EE%89%80":"%E2%99%89","%EE%89%81":"%E2%99%8A","%EE%89%82":"%E2%99%8B","%EE%89%83":"%E2%99%8C","%EE%89%84":"%E2%99%8D","%EE%89%85":"%E2%99%8E","%EE%89%86":"%E2%99%8F","%EE%89%87":"%E2%99%90","%EE%89%88":"%E2%99%91","%EE%89%89":"%E2%99%92","%EE%89%8A":"%E2%99%93","%EE%89%8B":"%E2%9B%8E","%EE%84%90":"%F0%9F%8C%BF","%EE%8C%84":"%F0%9F%8C%B7","%EE%84%98":"%F0%9F%8D%81","%EE%80%B0":"%F0%9F%8C%B8","%EE%80%B2":"%F0%9F%8C%B9","%EE%84%99":"%F0%9F%8D%82","%EE%91%87":"%F0%9F%8D%83","%EE%8C%83":"%F0%9F%8C%BA","%EE%8C%85":"%F0%9F%8C%BC","%EE%8C%87":"%F0%9F%8C%B4","%EE%8C%88":"%F0%9F%8C%B5","%EE%91%84":"%F0%9F%8C%BE","[%E3%81%A8%E3%81%86%E3%82%82%E3%82%8D%E3%81%93%E3%81%97]":"%F0%9F%8C%BD","[%E3%82%AD%E3%83%8E%E3%82%B3]":"%F0%9F%8D%84","[%E6%A0%97]":"%F0%9F%8C%B0","[%E3%81%95%E3%81%8F%E3%82%89%E3%82%93%E3%81%BC]":"%F0%9F%8D%92","[%E3%83%90%E3%83%8A%E3%83%8A]":"%F0%9F%8D%8C","%EE%8D%85":"%F0%9F%8D%8F","%EE%8D%86":"%F0%9F%8D%8A","%EE%8D%87":"%F0%9F%8D%93","%EE%8D%88":"%F0%9F%8D%89","%EE%8D%89":"%F0%9F%8D%85","%EE%8D%8A":"%F0%9F%8D%86","[%E3%83%A1%E3%83%AD%E3%83%B3]":"%F0%9F%8D%88","[%E3%83%91%E3%82%A4%E3%83%8A%E3%83%83%E3%83%97%E3%83%AB]":"%F0%9F%8D%8D","[%E3%83%96%E3%83%89%E3%82%A6]":"%F0%9F%8D%87","[%E3%83%A2%E3%83%A2]":"%F0%9F%8D%91","%EE%90%99":"%F0%9F%91%80","%EE%90%9B":"%F0%9F%91%82","%EE%90%9A":"%F0%9F%91%83","%EE%90%9C":"%F0%9F%91%84","%EE%90%89":"%F0%9F%98%9D","%EE%8C%9C":"%F0%9F%92%84","%EE%8C%9D":"%F0%9F%92%85","%EE%8C%9E":"%F0%9F%92%86","%EE%8C%9F":"%F0%9F%92%87","%EE%8C%A0":"%F0%9F%92%88","%E3%80%93":"%F0%9F%92%A0","%EE%80%81":"%F0%9F%91%A6","%EE%80%82":"%F0%9F%91%A7","%EE%80%84":"%F0%9F%91%A8","%EE%80%85":"%F0%9F%91%A9","[%E5%AE%B6%E6%97%8F]":"%F0%9F%91%AA","%EE%90%A8":"%F0%9F%91%AB","%EE%85%92":"%F0%9F%91%AE","%EE%90%A9":"%F0%9F%91%AF","[%E8%8A%B1%E5%AB%81]":"%F0%9F%91%B0","%EE%94%95":"%F0%9F%91%B1","%EE%94%96":"%F0%9F%91%B2","%EE%94%97":"%F0%9F%91%B3","%EE%94%98":"%F0%9F%91%B4","%EE%94%99":"%F0%9F%91%B5","%EE%94%9A":"%F0%9F%91%B6","%EE%94%9B":"%F0%9F%91%B7","%EE%94%9C":"%F0%9F%91%B8","[%E3%81%AA%E3%81%BE%E3%81%AF%E3%81%92]":"%F0%9F%91%B9","[%E5%A4%A9%E7%8B%97]":"%F0%9F%91%BA","%EE%84%9B":"%F0%9F%91%BB","%EE%81%8E":"%F0%9F%91%BC","%EE%84%8C":"%F0%9F%91%BD","%EE%84%AB":"%F0%9F%91%BE","%EE%84%9A":"%F0%9F%91%BF","%EE%84%9C":"%F0%9F%92%80","%EE%89%93":"%F0%9F%92%81","%EE%94%9E":"%F0%9F%92%82","%EE%94%9F":"%F0%9F%92%83","[%E3%82%AB%E3%82%BF%E3%83%84%E3%83%A0%E3%83%AA]":"%F0%9F%90%8C","%EE%94%AD":"%F0%9F%90%8D","%EE%84%B4":"%F0%9F%90%8E","%EE%94%AE":"%F0%9F%90%94","%EE%94%AF":"%F0%9F%90%97","%EE%94%B0":"%F0%9F%90%AB","%EE%94%A6":"%F0%9F%90%98","%EE%94%A7":"%F0%9F%90%A8","%EE%94%A8":"%F0%9F%90%92","%EE%94%A9":"%F0%9F%90%91","%EE%84%8A":"%F0%9F%90%99","%EE%91%81":"%F0%9F%90%9A","%EE%94%A5":"%F0%9F%90%9B","[%E3%82%A2%E3%83%AA]":"%F0%9F%90%9C","[%E3%83%9F%E3%83%84%E3%83%90%E3%83%81]":"%F0%9F%90%9D","[%E3%81%A6%E3%82%93%E3%81%A8%E3%81%86%E8%99%AB]":"%F0%9F%90%9E","%EE%94%A2":"%F0%9F%90%A0","%EE%80%99":"%F0%9F%8E%A3","[%E3%82%AB%E3%83%A1]":"%F0%9F%90%A2","%EE%94%A3":"%F0%9F%90%A3","%EE%94%A1":"%F0%9F%90%A6","%EE%81%95":"%F0%9F%90%A7","%EE%81%92":"%F0%9F%90%B6","%EE%94%A0":"%F0%9F%90%AC","%EE%81%93":"%F0%9F%90%AD","%EE%81%90":"%F0%9F%90%AF","%EE%81%8F":"%F0%9F%90%B1","%EE%81%94":"%F0%9F%90%B3","%EE%80%9A":"%F0%9F%90%B4","%EE%84%89":"%F0%9F%90%B5","%EE%84%8B":"%F0%9F%90%BD","%EE%81%91":"%F0%9F%90%BB","%EE%94%A4":"%F0%9F%90%B9","%EE%94%AA":"%F0%9F%90%BA","%EE%94%AB":"%F0%9F%90%AE","%EE%94%AC":"%F0%9F%90%B0","%EE%94%B1":"%F0%9F%90%B8","%EE%94%B6":"%F0%9F%91%A3","[%E8%BE%B0]":"%F0%9F%90%B2","[%E3%83%91%E3%83%B3%E3%83%80]":"%F0%9F%90%BC","%EE%81%99":"%F0%9F%98%A0","%EE%90%83":"%F0%9F%99%8D","%EE%90%90":"%F0%9F%98%B2","%EE%81%98":"%F0%9F%98%9E","%EE%90%86":"%F0%9F%98%AB","%EE%90%8F":"%F0%9F%98%B0","%EE%90%8E":"%F0%9F%98%92","%EE%84%86":"%F0%9F%98%BB","%EE%90%84":"%F0%9F%98%BC","%EE%84%85":"%F0%9F%98%9C","%EE%81%96":"%F0%9F%98%8A","%EE%90%98":"%F0%9F%98%BD","%EE%90%97":"%F0%9F%98%9A","%EE%90%8C":"%F0%9F%98%B7","%EE%90%8D":"%F0%9F%98%B3","%EE%81%97":"%F0%9F%98%BA","%EE%90%95%EE%8C%B1":"%F0%9F%98%85","%EE%90%8A":"%F0%9F%98%8C","%EE%90%92":"%F0%9F%98%B9","%EE%90%94":"%E2%98%BA","%EE%90%95":"%F0%9F%98%84","%EE%90%93":"%F0%9F%98%BF","%EE%90%91":"%F0%9F%98%AD","%EE%90%8B":"%F0%9F%98%A8","%EE%90%96":"%F0%9F%99%8E","%EE%90%87":"%F0%9F%92%AB","%EE%84%87":"%F0%9F%98%B1","%EE%90%88":"%F0%9F%98%AA","%EE%90%82":"%F0%9F%98%8F","%EE%84%88":"%F0%9F%98%93","%EE%90%81":"%F0%9F%98%A5","%EE%90%85":"%F0%9F%98%89","%EE%90%A3":"%F0%9F%99%85","%EE%90%A4":"%F0%9F%99%86","%EE%90%A6":"%F0%9F%99%87","(\/_%EF%BC%BC)":"%F0%9F%99%88","(%E3%83%BB%C3%97%E3%83%BB)":"%F0%9F%99%8A","|(%E3%83%BB%C3%97%E3%83%BB)|":"%F0%9F%99%89","%EE%80%92":"%E2%9C%8B","%EE%90%A7":"%F0%9F%99%8C","%EE%90%9D":"%F0%9F%99%8F","%EE%80%B6":"%F0%9F%8F%A1","%EE%80%B8":"%F0%9F%8F%A2","%EE%85%93":"%F0%9F%8F%A3","%EE%85%95":"%F0%9F%8F%A5","%EE%85%8D":"%F0%9F%8F%A6","%EE%85%94":"%F0%9F%8F%A7","%EE%85%98":"%F0%9F%8F%A8","%EE%94%81":"%F0%9F%8F%A9","%EE%85%96":"%F0%9F%8F%AA","%EE%85%97":"%F0%9F%8F%AB","%EE%80%B7":"%E2%9B%AA","%EE%84%A1":"%E2%9B%B2","%EE%94%84":"%F0%9F%8F%AC","%EE%94%85":"%F0%9F%8F%AF","%EE%94%86":"%F0%9F%8F%B0","%EE%94%88":"%F0%9F%8F%AD","%EE%88%82":"%F0%9F%9A%A2","%EE%8C%8B":"%F0%9F%8D%B6","%EE%80%BB":"%F0%9F%97%BB","%EE%94%89":"%F0%9F%97%BC","%EE%94%9D":"%F0%9F%97%BD","[%E6%97%A5%E6%9C%AC%E5%9C%B0%E5%9B%B3]":"%F0%9F%97%BE","[%E3%83%A2%E3%82%A2%E3%82%A4]":"%F0%9F%97%BF","%EE%80%87":"%F0%9F%91%9F","%EE%84%BE":"%F0%9F%91%A0","%EE%8C%9A":"%F0%9F%91%A1","%EE%8C%9B":"%F0%9F%91%A2","[%E3%83%A1%E3%82%AC%E3%83%8D]":"%F0%9F%91%93","%EE%80%86":"%F0%9F%91%9A","[%E3%82%B8%E3%83%BC%E3%83%B3%E3%82%BA]":"%F0%9F%91%96","%EE%84%8E":"%F0%9F%91%91","%EE%8C%82":"%F0%9F%91%94","%EE%8C%98":"%F0%9F%91%92","%EE%8C%99":"%F0%9F%91%97","%EE%8C%A1":"%F0%9F%91%98","%EE%8C%A2":"%F0%9F%91%99","[%E8%B2%A1%E5%B8%83]":"%F0%9F%91%9B","%EE%8C%A3":"%F0%9F%91%9C","[%E3%81%B5%E3%81%8F%E3%82%8D]":"%F0%9F%91%9D","%EE%84%AF":"%F0%9F%92%B5","%EE%85%89":"%F0%9F%92%B1","%EE%85%8A":"%F0%9F%93%88","[%E3%82%AB%E3%83%BC%E3%83%89]":"%F0%9F%92%B3","%EF%BF%A5":"%F0%9F%92%B4","[%E9%A3%9B%E3%82%93%E3%81%A7%E3%81%84%E3%81%8F%E3%81%8A%E9%87%91]":"%F0%9F%92%B8","%EE%94%93":"%F0%9F%87%A8%F0%9F%87%B3","%EE%94%8E":"%F0%9F%87%A9%F0%9F%87%AA","%EE%94%91":"%F0%9F%87%AA%F0%9F%87%B8","%EE%94%8D":"%F0%9F%87%AB%F0%9F%87%B7","%EE%94%90":"%F0%9F%87%AC%F0%9F%87%A7","%EE%94%8F":"%F0%9F%87%AE%F0%9F%87%B9","%EE%94%8B":"%F0%9F%87%AF%F0%9F%87%B5","%EE%94%94":"%F0%9F%87%B0%F0%9F%87%B7","%EE%94%92":"%F0%9F%87%B7%F0%9F%87%BA","%EE%94%8C":"%F0%9F%87%BA%F0%9F%87%B8","%EE%84%9D":"%F0%9F%94%A5","[%E6%87%90%E4%B8%AD%E9%9B%BB%E7%81%AF]":"%F0%9F%94%A6","[%E3%83%AC%E3%83%B3%E3%83%81]":"%F0%9F%94%A7","%EE%84%96":"%F0%9F%94%A8","[%E3%83%8D%E3%82%B8]":"%F0%9F%94%A9","[%E5%8C%85%E4%B8%81]":"%F0%9F%94%AA","%EE%84%93":"%F0%9F%94%AB","%EE%88%BE":"%F0%9F%94%AF","%EE%88%89":"%F0%9F%94%B0","%EE%80%B1":"%F0%9F%94%B1","%EE%84%BB":"%F0%9F%92%89","%EE%8C%8F":"%F0%9F%92%8A","%EE%94%B2":"%F0%9F%85%B0","%EE%94%B3":"%F0%9F%85%B1","%EE%94%B4":"%F0%9F%86%8E","%EE%94%B5":"%F0%9F%85%BE","%EE%8C%94":"%F0%9F%8E%80","%EE%84%92":"%F0%9F%93%A6","%EE%8D%8B":"%F0%9F%8E%82","%EE%80%B3":"%F0%9F%8E%84","%EE%91%88":"%F0%9F%8E%85","%EE%85%83":"%F0%9F%8E%8C","%EE%84%97":"%F0%9F%8E%86","%EE%8C%90":"%F0%9F%8E%88","%EE%8C%92":"%F0%9F%8E%89","%EE%90%B6":"%F0%9F%8E%8D","%EE%90%B8":"%F0%9F%8E%8E","%EE%90%B9":"%F0%9F%8E%93","%EE%90%BA":"%F0%9F%8E%92","%EE%90%BB":"%F0%9F%8E%8F","%EE%91%80":"%F0%9F%8E%87","%EE%91%82":"%F0%9F%8E%90","%EE%91%85":"%F0%9F%8E%83","[%E3%82%AA%E3%83%A1%E3%83%87%E3%83%88%E3%82%A6]":"%F0%9F%8E%8A","[%E4%B8%83%E5%A4%95]":"%F0%9F%8E%8B","%EE%91%86":"%F0%9F%8E%91","[%E3%83%9D%E3%82%B1%E3%83%99%E3%83%AB]":"%F0%9F%93%9F","%EE%80%89":"%F0%9F%93%9E","%EE%80%8A":"%F0%9F%93%B1","%EE%84%84":"%F0%9F%93%B2","%EE%8C%81":"%F0%9F%93%91","%EE%80%8B":"%F0%9F%93%A0","%EE%84%83":"%F0%9F%93%A7","%EE%84%81":"%F0%9F%93%AB","%EE%84%82":"%F0%9F%93%AE","[%E6%96%B0%E8%81%9E]":"%F0%9F%93%B0","%EE%85%82":"%F0%9F%93%A2","%EE%8C%97":"%F0%9F%93%A3","%EE%85%8B":"%F0%9F%93%A1","[%E9%80%81%E4%BF%A1BOX]":"%F0%9F%93%A4","[%E5%8F%97%E4%BF%A1BOX]":"%F0%9F%93%A5","[ABCD]":"%F0%9F%94%A1","[1234]":"%F0%9F%94%A2","[%E8%A8%98%E5%8F%B7]":"%F0%9F%94%A3","[ABC]":"%F0%9F%94%A4","[%E3%83%9A%E3%83%B3]":"%E2%9C%92","%EE%84%9F":"%F0%9F%92%BA","%EE%80%8C":"%F0%9F%92%BB","[%E3%82%AF%E3%83%AA%E3%83%83%E3%83%97]":"%F0%9F%93%8E","%EE%84%9E":"%F0%9F%92%BC","%EE%8C%96":"%F0%9F%92%BE","%EE%84%A6":"%F0%9F%92%BF","%EE%84%A7":"%F0%9F%93%80","%EE%8C%93":"%E2%9C%82","[%E7%94%BB%E3%81%B3%E3%82%87%E3%81%86]":"%F0%9F%93%8C","[%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC]":"%F0%9F%93%86","[%E3%83%95%E3%82%A9%E3%83%AB%E3%83%80]":"%F0%9F%93%82","%EE%85%88":"%F0%9F%93%92","[%E5%90%8D%E6%9C%AD]":"%F0%9F%93%9B","[%E3%82%B9%E3%82%AF%E3%83%AD%E3%83%BC%E3%83%AB]":"%F0%9F%93%9C","[%E3%82%B0%E3%83%A9%E3%83%95]":"%F0%9F%93%89","[%E5%AE%9A%E8%A6%8F]":"%F0%9F%93%8F","[%E4%B8%89%E8%A7%92%E5%AE%9A%E8%A6%8F]":"%F0%9F%93%90","%EE%80%96":"%E2%9A%BE","%EE%80%94":"%E2%9B%B3","%EE%80%95":"%F0%9F%8E%BE","%EE%80%98":"%E2%9A%BD","%EE%80%93":"%F0%9F%8E%BF","%EE%90%AA":"%F0%9F%8F%80","%EE%84%B2":"%F0%9F%8F%81","[%E3%82%B9%E3%83%8E%E3%83%9C]":"%F0%9F%8F%82","%EE%84%95":"%F0%9F%8F%83","%EE%80%97":"%F0%9F%8F%84","%EE%84%B1":"%F0%9F%8F%86","%EE%90%AB":"%F0%9F%8F%88","%EE%90%AD":"%F0%9F%8F%8A","%EE%80%9E":"%F0%9F%9A%83","%EE%90%B4":"%E2%93%82","%EE%90%B5":"%F0%9F%9A%84","%EE%80%9F":"%F0%9F%9A%85","%EE%80%9B":"%F0%9F%9A%97","%EE%90%AE":"%F0%9F%9A%99","%EE%85%99":"%F0%9F%9A%8C","%EE%85%90":"%F0%9F%9A%8F","%EE%80%9D":"%E2%9C%88","%EE%80%9C":"%E2%9B%B5","%EE%80%B9":"%F0%9F%9A%89","%EE%84%8D":"%F0%9F%9A%80","%EE%84%B5":"%F0%9F%9A%A4","%EE%85%9A":"%F0%9F%9A%95","%EE%90%AF":"%F0%9F%9A%9A","%EE%90%B0":"%F0%9F%9A%92","%EE%90%B1":"%F0%9F%9A%91","%EE%90%B2":"%F0%9F%9A%A8","%EE%80%BA":"%E2%9B%BD","%EE%85%8F":"%F0%9F%85%BF","%EE%85%8E":"%F0%9F%9A%A5","%EE%84%B7":"%E2%9B%94","%EE%84%A3":"%E2%99%A8","%EE%84%A2":"%E2%9B%BA","%EE%84%A4":"%F0%9F%8E%A1","%EE%90%B3":"%F0%9F%8E%A2","%EE%80%BC":"%F0%9F%8E%A4","%EE%80%BD":"%F0%9F%93%B9","%EE%94%87":"%F0%9F%8E%A6","%EE%8C%8A":"%F0%9F%8E%A7","%EE%94%82":"%F0%9F%8E%A8","%EE%94%83":"%F0%9F%8E%AD","[%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88]":"%F0%9F%8E%AA","%EE%84%A5":"%F0%9F%8E%AB","%EE%8C%A4":"%F0%9F%8E%AC","[%E3%82%B2%E3%83%BC%E3%83%A0]":"%F0%9F%8E%AE","%EE%84%AD":"%F0%9F%80%84","%EE%84%B0":"%F0%9F%8E%AF","%EE%84%B3":"%F0%9F%8E%B0","%EE%90%AC":"%F0%9F%8E%B1","[%E3%82%B5%E3%82%A4%E3%82%B3%E3%83%AD]":"%F0%9F%8E%B2","[%E3%83%9C%E3%83%BC%E3%83%AA%E3%83%B3%E3%82%B0]":"%F0%9F%8E%B3","[%E8%8A%B1%E6%9C%AD]":"%F0%9F%8E%B4","[%E3%82%B8%E3%83%A7%E3%83%BC%E3%82%AB%E3%83%BC]":"%F0%9F%83%8F","%EE%80%BE":"%F0%9F%8E%B5","%EE%8C%A6":"%F0%9F%8E%BC","%EE%81%80":"%F0%9F%8E%B7","%EE%81%81":"%F0%9F%8E%B8","[%E3%83%94%E3%82%A2%E3%83%8E]":"%F0%9F%8E%B9","%EE%81%82":"%F0%9F%8E%BA","[%E3%83%90%E3%82%A4%E3%82%AA%E3%83%AA%E3%83%B3]":"%F0%9F%8E%BB","%EE%84%AC":"%E3%80%BD","%EE%80%88":"%F0%9F%93%B7","%EE%84%AA":"%F0%9F%93%BA","%EE%84%A8":"%F0%9F%93%BB","%EE%84%A9":"%F0%9F%93%BC","%EE%80%83":"%F0%9F%92%8B","%EE%84%83%EE%8C%A8":"%F0%9F%92%8C","%EE%80%B4":"%F0%9F%92%8D","%EE%80%B5":"%F0%9F%92%8E","%EE%84%91":"%F0%9F%92%8F","%EE%8C%86":"%F0%9F%92%90","%EE%90%A5":"%F0%9F%92%91","%EE%90%BD":"%F0%9F%92%92","%EE%88%87":"%F0%9F%94%9E","%EE%89%8E":"%C2%A9","%EE%89%8F":"%C2%AE","%EE%94%B7":"%E2%84%A2","[%EF%BD%89]":"%E2%84%B9","%EE%88%90":"#%E2%83%A3","%EE%88%9C":"1%E2%83%A3","%EE%88%9D":"2%E2%83%A3","%EE%88%9E":"3%E2%83%A3","%EE%88%9F":"4%E2%83%A3","%EE%88%A0":"5%E2%83%A3","%EE%88%A1":"6%E2%83%A3","%EE%88%A2":"7%E2%83%A3","%EE%88%A3":"8%E2%83%A3","%EE%88%A4":"9%E2%83%A3","%EE%88%A5":"0%E2%83%A3","[10]":"%F0%9F%94%9F","%EE%88%8B":"%F0%9F%93%B6","%EE%89%90":"%F0%9F%93%B3","%EE%89%91":"%F0%9F%93%B4","%EE%84%A0":"%F0%9F%8D%94","%EE%8D%82":"%F0%9F%8D%99","%EE%81%86":"%F0%9F%8D%B0","%EE%8D%80":"%F0%9F%8D%9C","%EE%8C%B9":"%F0%9F%8D%9E","%EE%85%87":"%F0%9F%8D%B3","%EE%8C%BA":"%F0%9F%8D%A6","%EE%8C%BB":"%F0%9F%8D%9F","%EE%8C%BC":"%F0%9F%8D%A1","%EE%8C%BD":"%F0%9F%8D%98","%EE%8C%BE":"%F0%9F%8D%9A","%EE%8C%BF":"%F0%9F%8D%9D","%EE%8D%81":"%F0%9F%8D%9B","%EE%8D%83":"%F0%9F%8D%A2","%EE%8D%84":"%F0%9F%8D%A3","%EE%8D%8C":"%F0%9F%8D%B1","%EE%8D%8D":"%F0%9F%8D%B2","%EE%90%BF":"%F0%9F%8D%A7","[%E8%82%89]":"%F0%9F%8D%96","[%E3%81%AA%E3%82%8B%E3%81%A8]":"%F0%9F%8D%A5","[%E3%82%84%E3%81%8D%E3%81%84%E3%82%82]":"%F0%9F%8D%A0","[%E3%83%94%E3%82%B6]":"%F0%9F%8D%95","[%E3%83%81%E3%82%AD%E3%83%B3]":"%F0%9F%8D%97","[%E3%82%A2%E3%82%A4%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%A0]":"%F0%9F%8D%A8","[%E3%83%89%E3%83%BC%E3%83%8A%E3%83%84]":"%F0%9F%8D%A9","[%E3%82%AF%E3%83%83%E3%82%AD%E3%83%BC]":"%F0%9F%8D%AA","[%E3%83%81%E3%83%A7%E3%82%B3]":"%F0%9F%8D%AB","[%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%87%E3%82%A3]":"%F0%9F%8D%AD","[%E3%83%97%E3%83%AA%E3%83%B3]":"%F0%9F%8D%AE","[%E3%83%8F%E3%83%81%E3%83%9F%E3%83%84]":"%F0%9F%8D%AF","[%E3%82%A8%E3%83%93%E3%83%95%E3%83%A9%E3%82%A4]":"%F0%9F%8D%A4","%EE%81%83":"%F0%9F%8D%B4","%EE%81%85":"%E2%98%95","%EE%81%84":"%F0%9F%8D%B9","%EE%81%87":"%F0%9F%8D%BA","%EE%8C%B8":"%F0%9F%8D%B5","%EE%8C%8C":"%F0%9F%8D%BB","%EE%88%B6":"%E2%A4%B4","%EE%88%B8":"%E2%A4%B5","%EE%88%B7":"%E2%86%96","%EE%88%B9":"%E2%86%99","%E2%87%94":"%E2%86%94","%E2%86%91%E2%86%93":"%F0%9F%94%83","%EE%88%B2":"%E2%AC%86","%EE%88%B3":"%E2%AC%87","%EE%88%B4":"%E2%9E%A1","%EE%88%B5":"%F0%9F%94%99","%EE%88%BA":"%E2%96%B6","%EE%88%BB":"%E2%97%80","%EE%88%BC":"%E2%8F%A9","%EE%88%BD":"%E2%8F%AA","%E2%96%B2":"%F0%9F%94%BC","%E2%96%BC":"%F0%9F%94%BD","%EE%8C%B2":"%E2%AD%95","%EE%8C%B3":"%E2%9C%96","%EE%80%A1":"%E2%9D%97","%EF%BC%81%EF%BC%9F":"%E2%81%89","%EF%BC%81%EF%BC%81":"%E2%80%BC","%EE%80%A0":"%E2%9D%93","%EE%8C%B6":"%E2%9D%94","%EE%8C%B7":"%E2%9D%95","%EF%BD%9E":"%E2%9E%B0","%EE%88%91":"%E2%9E%BF","%EE%80%A2":"%E2%9D%A4","%EE%8C%A7":"%F0%9F%92%9E","%EE%80%A3":"%F0%9F%92%94","%EE%8C%A8":"%F0%9F%92%97","%EE%8C%A9":"%F0%9F%92%98","%EE%8C%AA":"%F0%9F%92%99","%EE%8C%AB":"%F0%9F%92%9A","%EE%8C%AC":"%F0%9F%92%9B","%EE%8C%AD":"%F0%9F%92%9C","%EE%90%B7":"%F0%9F%92%9D","%EE%88%84":"%F0%9F%92%9F","%EE%88%8C":"%E2%99%A5","%EE%88%8E":"%E2%99%A0","%EE%88%8D":"%E2%99%A6","%EE%88%8F":"%E2%99%A3","%EE%8C%8E":"%F0%9F%9A%AC","%EE%88%88":"%F0%9F%9A%AD","%EE%88%8A":"%E2%99%BF","[%E6%97%97]":"%F0%9F%9A%A9","%EE%89%92":"%E2%9A%A0","%EE%84%B6":"%F0%9F%9A%B2","%EE%88%81":"%F0%9F%9A%B6","%EE%84%B8":"%F0%9F%9A%B9","%EE%84%B9":"%F0%9F%9A%BA","%EE%84%BF":"%F0%9F%9B%80","%EE%85%91":"%F0%9F%9A%BB","%EE%85%80":"%F0%9F%9A%BD","%EE%8C%89":"%F0%9F%9A%BE","%EE%84%BA":"%F0%9F%9A%BC","[%E3%83%89%E3%82%A2]":"%F0%9F%9A%AA","[%E7%A6%81%E6%AD%A2]":"%F0%9F%9A%AB","[%E3%83%81%E3%82%A7%E3%83%83%E3%82%AF%E3%83%9E%E3%83%BC%E3%82%AF]":"%E2%9C%85","[CL]":"%F0%9F%86%91","%EE%88%94":"%F0%9F%86%92","[FREE]":"%F0%9F%86%93","%EE%88%A9":"%F0%9F%86%94","%EE%88%92":"%F0%9F%86%95","[NG]":"%F0%9F%86%96","%EE%89%8D":"%F0%9F%86%97","[SOS]":"%F0%9F%86%98","%EE%88%93":"%F0%9F%86%99","%EE%84%AE":"%F0%9F%86%9A","%EE%88%83":"%F0%9F%88%81","%EE%88%A8":"%F0%9F%88%82","[%E7%A6%81]":"%F0%9F%88%B2","%EE%88%AB":"%F0%9F%88%B3","[%E5%90%88]":"%F0%9F%88%B4","%EE%88%AA":"%F0%9F%88%B5","%EE%88%95":"%F0%9F%88%B6","%EE%88%96":"%F0%9F%88%9A","%EE%88%97":"%F0%9F%88%B7","%EE%88%98":"%F0%9F%88%B8","%EE%88%A7":"%F0%9F%88%B9","%EE%88%AC":"%F0%9F%88%AF","%EE%88%AD":"%F0%9F%88%BA","%EE%8C%95":"%E3%8A%99","%EE%8C%8D":"%E3%8A%97","%EE%88%A6":"%F0%9F%89%90","[%E5%8F%AF]":"%F0%9F%89%91","[%EF%BC%8B]":"%E2%9E%95","[%EF%BC%8D]":"%E2%9E%96","[%C3%B7]":"%E2%9E%97","%EE%84%8F":"%F0%9F%92%A1","%EE%8C%B4":"%F0%9F%92%A2","%EE%8C%91":"%F0%9F%92%A3","%EE%84%BC":"%F0%9F%92%A4","[%E3%83%89%E3%83%B3%E3%83%83]":"%F0%9F%92%A5","%EE%8C%B1":"%F0%9F%92%A7","%EE%8C%B0":"%F0%9F%92%A8","%EE%81%9A":"%F0%9F%92%A9","%EE%85%8C":"%F0%9F%92%AA","[%E3%83%95%E3%82%AD%E3%83%80%E3%82%B7]":"%F0%9F%92%AC","%EE%8C%AE":"%E2%9D%87","%EE%88%85":"%E2%9C%B4","%EE%88%86":"%E2%9C%B3","%EE%88%99":"%F0%9F%94%B4","%EE%88%9A":"%E2%97%BC","%EE%88%9B":"%F0%9F%94%B9","%EE%8C%AF":"%E2%AD%90","[%E8%8A%B1%E4%B8%B8]":"%F0%9F%92%AE","[100%E7%82%B9]":"%F0%9F%92%AF","%E2%86%90%E2%94%98":"%E2%86%A9","%E2%94%94%E2%86%92":"%E2%86%AA","%EE%85%81":"%F0%9F%94%8A","[%E9%9B%BB%E6%B1%A0]":"%F0%9F%94%8B","[%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%B3%E3%83%88]":"%F0%9F%94%8C","%EE%84%94":"%F0%9F%94%8E","%EE%85%84":"%F0%9F%94%90","%EE%85%85":"%F0%9F%94%93","%EE%80%BF":"%F0%9F%94%91","%EE%8C%A5":"%F0%9F%94%94","[%E3%83%A9%E3%82%B8%E3%82%AA%E3%83%9C%E3%82%BF%E3%83%B3]":"%F0%9F%94%98","[%E3%83%96%E3%83%83%E3%82%AF%E3%83%9E%E3%83%BC%E3%82%AF]":"%F0%9F%94%96","[%E3%83%AA%E3%83%B3%E3%82%AF]":"%F0%9F%94%97","[END]":"%F0%9F%94%9A","[ON]":"%F0%9F%94%9B","[SOON]":"%F0%9F%94%9C","%EE%89%8C":"%F0%9F%94%9D","%EE%80%90":"%E2%9C%8A","%EE%80%91":"%E2%9C%8C","%EE%80%8D":"%F0%9F%91%8A","%EE%80%8E":"%F0%9F%91%8D","%EE%80%8F":"%E2%98%9D","%EE%88%AE":"%F0%9F%91%86","%EE%88%AF":"%F0%9F%91%87","%EE%88%B0":"%F0%9F%91%88","%EE%88%B1":"%F0%9F%91%89","%EE%90%9E":"%F0%9F%91%8B","%EE%90%9F":"%F0%9F%91%8F","%EE%90%A0":"%F0%9F%91%8C","%EE%90%A1":"%F0%9F%91%8E","%EE%90%A2":"%F0%9F%91%90"}, patterns = [],
        metachars = /[[\]{}()*+?.\\|^$\-,&#\s]/g;


    /*
$.each(threeByteToFourByte, function(index, item) {
        threeByteToFourByte[index.toUpperCase()] = item.toUpperCase();
   });
*/
    ////console.log(threeByteToFourByte);

    for (var i in threeByteToFourByte) {
        if (threeByteToFourByte.hasOwnProperty(i)){ // escape metacharacters
            patterns.push('('+i.replace(metachars, "\\$&")+')');
        }
    }

    // build the regular expression and replace
    return text.replace(new RegExp(patterns.join('|'),'g'), function (match) {
        return typeof threeByteToFourByte[match] != 'undefined' ?
            threeByteToFourByte[match] :
            match;
    });

}




function mapRegularEmoticonTextValuesToImages(text)
{
    var emoticons = {
            ':-)' : 'smile',
            ':-('  : 'frown',
            ';-)'  : 'wink',
            ':-P'  : 'tongue',
            '=-O' : 'surprised',
            ':-*' : 'kiss',
            ':O' : 'yelling',
            'B-)' : 'cool',
            ':-$' : 'moneymouth',
            ':-!' : 'footinmouth',
            ':-[' : 'embarrassed',
            'O:-)' : 'angel',
            ':&#39;(' : 'cry',
            ':-X' : 'lipsaresealed',
            ':-D' : 'laughing',
            'o_O' : 'confused',
            '&lt;3' : 'heart',
            '<3' : 'heart',
            'x-(' : 'angry',
            ':-/' : 'smirk',
            ':-I' : 'pokerface',
            ':-\\' : 'undecided'
        }, patterns = [],
        metachars = /[[\]{}()*+?.\\|^$\-,&#\s]/g;

    ////console.log('emoticons: ');
    ////console.log(emoticons);
    // build a regex pattern for each defined property
    for (var i in emoticons) {
        if (emoticons.hasOwnProperty(i)){ // escape metacharacters
            patterns.push('('+i.replace(metachars, "\\$&")+')');
        }
    }

    // build the regular expression and replace
    return text.replace(new RegExp(patterns.join('|'),'g'), function (match) {
        //HAD TO SWAP EMOTICON CLASS FOR GEMOTICON BECAUSE FB HAD CSS FOR EMOTICON
        return typeof emoticons[match] != 'undefined' ?
            '<img height="18px" width="18px" class="gEmoticon adjustedSpriteForMessageDisplay mt_sprite sprite-' + emoticons[match] + '" data-textvalue="' + match + '"  src="' + imgPlaceHolderURL + '"/>' :
            match;
    });

}

function mapFourByteEncodedEmojiValuesToImages(text)
{

    ////console.log('addEmoticons called:');
    ////console.log(text);
    var emoji = {
            "%F0%9F%98%81":"1f601",
            "%F0%9F%98%82":"1f602",
            "%F0%9F%98%83":"1f603",
            "%F0%9F%98%84":"1f604",
            "%F0%9F%98%85":"1f605",
            "%F0%9F%98%86":"1f606",
            "%F0%9F%98%89":"1f609",
            "%F0%9F%98%8A":"1f60a",
            "%F0%9F%98%8B":"1f60b",
            "%F0%9F%98%8C":"1f60c",
            "%F0%9F%98%8D":"1f60d",
            "%F0%9F%98%8F":"1f60f",
            "%F0%9F%98%92":"1f612",
            "%F0%9F%98%93":"1f613",
            "%F0%9F%98%94":"1f614",
            "%F0%9F%98%96":"1f616",
            "%F0%9F%98%98":"1f618",
            "%F0%9F%98%9A":"1f61a",
            "%F0%9F%98%9C":"1f61c",
            "%F0%9F%98%9D":"1f61d",
            "%F0%9F%98%9E":"1f61e",
            "%F0%9F%98%A0":"1f620",
            "%F0%9F%98%A1":"1f621",
            "%F0%9F%98%A2":"1f622",
            "%F0%9F%98%A3":"1f623",
            "%F0%9F%98%A4":"1f624",
            "%F0%9F%98%A5":"1f625",
            "%F0%9F%98%A8":"1f628",
            "%F0%9F%98%A9":"1f629",
            "%F0%9F%98%AA":"1f62a",
            "%F0%9F%98%AB":"1f62b",
            "%F0%9F%98%AD":"1f62d",
            "%F0%9F%98%B0":"1f630",
            "%F0%9F%98%B1":"1f631",
            "%F0%9F%98%B2":"1f632",
            "%F0%9F%98%B3":"1f633",
            "%F0%9F%98%B5":"1f635",
            "%F0%9F%98%B7":"1f637",
            "%F0%9F%98%B8":"1f638",
            "%F0%9F%98%B9":"1f639",
            "%F0%9F%98%BA":"1f63a",
            "%F0%9F%98%BB":"1f63b",
            "%F0%9F%98%BC":"1f63c",
            "%F0%9F%98%BD":"1f63d",
            "%F0%9F%98%BE":"1f63e",
            "%F0%9F%98%BF":"1f63f",
            "%F0%9F%99%80":"1f640",
            "%F0%9F%99%85":"1f645",
            "%F0%9F%99%86":"1f646",
            "%F0%9F%99%87":"1f647",
            "%F0%9F%99%88":"1f648",
            "%F0%9F%99%89":"1f649",
            "%F0%9F%99%8A":"1f64a",
            "%F0%9F%99%8B":"1f64b",
            "%F0%9F%99%8C":"1f64c",
            "%F0%9F%99%8D":"1f64d",
            "%F0%9F%99%8E":"1f64e",
            "%F0%9F%99%8F":"1f64f",  //CRV START OF SECOND GROUP
            "%E2%9C%82":"2702",
            "%E2%9C%85":"2705",
            "%E2%9C%88":"2708",
            "%E2%9C%89":"2709",
            "%E2%9C%8A":"270a",
            "%E2%9C%8B":"270b",
            "%E2%9C%8C":"270c",
            "%E2%9C%8F":"270f",
            "%E2%9C%92":"2712",
            "%E2%9C%94":"2714",
            "%E2%9C%96":"2716",
            "%E2%9C%A8":"2728",
            "%E2%9C%B3":"2733",
            "%E2%9C%B4":"2734",
            "%E2%9D%84":"2744",
            "%E2%9D%87":"2747",
            "%E2%9D%8C":"274c",
            "%E2%9D%8E":"274e",
            "%E2%9D%93":"2753",
            "%E2%9D%94":"2754",
            "%E2%9D%95":"2755",
            "%E2%9D%97":"2757",
            "%E2%9D%A4":"2764",
            "%E2%9E%95":"2795",
            "%E2%9E%96":"2796",
            "%E2%9E%97":"2797",
            "%E2%9E%A1":"27a1",
            "%E2%9E%B0":"27b0",
            "%F0%9F%9A%80":"1f680",
            "%F0%9F%9A%83":"1f683",
            "%F0%9F%9A%84":"1f684",
            "%F0%9F%9A%85":"1f685",
            "%F0%9F%9A%87":"1f687",
            "%F0%9F%9A%89":"1f689",
            "%F0%9F%9A%8C":"1f68c",
            "%F0%9F%9A%8F":"1f68f",
            "%F0%9F%9A%91":"1f691",
            "%F0%9F%9A%92":"1f692",
            "%F0%9F%9A%93":"1f693",
            "%F0%9F%9A%95":"1f695",
            "%F0%9F%9A%97":"1f697",
            "%F0%9F%9A%99":"1f699",
            "%F0%9F%9A%9A":"1f69a",
            "%F0%9F%9A%A2":"1f6a2",
            "%F0%9F%9A%A4":"1f6a4",
            "%F0%9F%9A%A5":"1f6a5",
            "%F0%9F%9A%A7":"1f6a7",
            "%F0%9F%9A%A8":"1f6a8",
            "%F0%9F%9A%A9":"1f6a9",
            "%F0%9F%9A%AA":"1f6aa",
            "%F0%9F%9A%AB":"1f6ab",
            "%F0%9F%9A%AC":"1f6ac",
            "%F0%9F%9A%AD":"1f6ad",
            "%F0%9F%9A%B2":"1f6b2",
            "%F0%9F%9A%B6":"1f6b6",
            "%F0%9F%9A%B9":"1f6b9",
            "%F0%9F%9A%BA":"1f6ba",
            "%F0%9F%9A%BB":"1f6bb",
            "%F0%9F%9A%BC":"1f6bc",
            "%F0%9F%9A%BD":"1f6bd",
            "%F0%9F%9A%BE":"1f6be",
            "%F0%9F%9B%80":"1f6c0",
            "%E2%93%82":"24c2",  //CRV Start of third section.
            "%F0%9F%85%B0":"1f170",
            "%F0%9F%85%B1":"1f171",
            "%F0%9F%85%BE":"1f17e",
            "%F0%9F%85%BF":"1f17f",
            "%F0%9F%86%8E":"1f18e",
            "%F0%9F%86%91":"1f191",
            "%F0%9F%86%92":"1f192",
            "%F0%9F%86%93":"1f193",
            "%F0%9F%86%94":"1f194",
            "%F0%9F%86%95":"1f195",
            "%F0%9F%86%96":"1f196",
            "%F0%9F%86%97":"1f197",
            "%F0%9F%86%98":"1f198",
            "%F0%9F%86%99":"1f199",
            "%F0%9F%86%9A":"1f19a",
            "%F0%9F%87%A9%F0%9F%87%AA":"1f1e9-1f1ea",
            "%F0%9F%87%AC%F0%9F%87%A7":"1f1ec-1f1e7",
            "%F0%9F%87%A8%F0%9F%87%B3":"1f1e8-1f1f3",
            "%F0%9F%87%AF%F0%9F%87%B5":"1f1ef-1f1f5",
            "%F0%9F%87%B0%F0%9F%87%B7":"1f1f0-1f1f7",
            "%F0%9F%87%AB%F0%9F%87%B7":"1f1eb-1f1f7",
            "%F0%9F%87%AA%F0%9F%87%B8":"1f1ea-1f1f8",
            "%F0%9F%87%AE%F0%9F%87%B9":"1f1ee-1f1f9",
            "%F0%9F%87%BA%F0%9F%87%B8":"1f1fa-1f1f8",
            "%F0%9F%87%B7%F0%9F%87%BA":"1f1f7-1f1fa",
            "%F0%9F%88%81":"1f201",
            "%F0%9F%88%82":"1f202",
            "%F0%9F%88%9A":"1f21a",
            "%F0%9F%88%AF":"1f22f",
            "%F0%9F%88%B2":"1f232",
            "%F0%9F%88%B3":"1f233",
            "%F0%9F%88%B4":"1f234",
            "%F0%9F%88%B5":"1f235",
            "%F0%9F%88%B6":"1f236",
            "%F0%9F%88%B7":"1f237",
            "%F0%9F%88%B8":"1f238",
            "%F0%9F%88%B9":"1f239",
            "%F0%9F%88%BA":"1f23a",
            "%F0%9F%89%90":"1f250",
            "%F0%9F%89%91":"1f251", //CRV Start of the 5th section
            "%C2%A9":"00a9",
            "%C2%AE":"00ae",
            "%E2%80%BC":"203c",
            "%E2%81%89":"2049",
            "%38%E2%83%A3":"0038",
            "%39%E2%83%A3":"0039",
            "%37%E2%83%A3":"0037",
            "%36%E2%83%A3":"0036",
            "%31%E2%83%A3":"0031",
            "%30%E2%83%A3":"0030",
            "%32%E2%83%A3":"0032",
            "%33%E2%83%A3":"0033",
            "%35%E2%83%A3":"0035",
            "%34%E2%83%A3":"0034",
            "%23%E2%83%A3":"0023",
            "%E2%84%A2":"2122",
            "%E2%84%B9":"2139",
            "%E2%86%94":"2194",
            "%E2%86%95":"2195",
            "%E2%86%96":"2196",
            "%E2%86%97":"2197",
            "%E2%86%98":"2198",
            "%E2%86%99":"2199",
            "%E2%86%A9":"21a9",
            "%E2%86%AA":"21aa",
            "%E2%8C%9A":"231a",
            "%E2%8C%9B":"231b",
            "%E2%8F%A9":"23e9",
            "%E2%8F%AA":"23ea",
            "%E2%8F%AB":"23eb",
            "%E2%8F%AC":"23ec",
            "%E2%8F%B0":"23f0",
            "%E2%8F%B3":"23f3",
            "%E2%96%AA":"25aa",
            "%E2%96%AB":"25ab",
            "%E2%96%B6":"25b6",
            "%E2%97%80":"25c0",
            "%E2%97%BB":"25fb",
            "%E2%97%BC":"25fc",
            "%E2%97%BD":"25fd",
            "%E2%97%BE":"25fe",
            "%E2%98%80":"2600",
            "%E2%98%81":"2601",
            "%E2%98%8E":"260e",
            "%E2%98%91":"2611",
            "%E2%98%94":"2614",
            "%E2%98%95":"2615",
            "%E2%98%9D":"261d",
            "%E2%98%BA":"263a",
            "%E2%99%88":"2648",
            "%E2%99%89":"2649",
            "%E2%99%8A":"264a",
            "%E2%99%8B":"264b",
            "%E2%99%8C":"264c",
            "%E2%99%8D":"264d",
            "%E2%99%8E":"264e",
            "%E2%99%8F":"264f",
            "%E2%99%90":"2650",
            "%E2%99%91":"2651",
            "%E2%99%92":"2652",
            "%E2%99%93":"2653",
            "%E2%99%A0":"2660",
            "%E2%99%A3":"2663",
            "%E2%99%A5":"2665",
            "%E2%99%A6":"2666",
            "%E2%99%A8":"2668",
            "%E2%99%BB":"267b",
            "%E2%99%BF":"267f",
            "%E2%9A%93":"2693",
            "%E2%9A%A0":"26a0",
            "%E2%9A%A1":"26a1",
            "%E2%9A%AA":"26aa",
            "%E2%9A%AB":"26ab",
            "%E2%9A%BD":"26bd",
            "%E2%9A%BE":"26be",
            "%E2%9B%84":"26c4",
            "%E2%9B%85":"26c5",
            "%E2%9B%8E":"26ce",
            "%E2%9B%94":"26d4",
            "%E2%9B%AA":"26ea",
            "%E2%9B%B2":"26f2",
            "%E2%9B%B3":"26f3",
            "%E2%9B%B5":"26f5",
            "%E2%9B%BA":"26fa",
            "%E2%9B%BD":"26fd",
            "%E2%A4%B4":"2934",
            "%E2%A4%B5":"2935",
            "%E2%AC%85":"2b05",
            "%E2%AC%86":"2b06",
            "%E2%AC%87":"2b07",
            "%E2%AC%9B":"2b1b",
            "%E2%AC%9C":"2b1c",
            "%E2%AD%90":"2b50",
            "%E2%AD%95":"2b55",
            "%E3%80%B0":"3030",
            "%E3%80%BD":"303d",
            "%E3%8A%97":"3297",
            "%E3%8A%99":"3299",
            "%F0%9F%80%84":"1f004",
            "%F0%9F%83%8F":"1f0cf",
            "%F0%9F%8C%80":"1f300",
            "%F0%9F%8C%81":"1f301",
            "%F0%9F%8C%82":"1f302",
            "%F0%9F%8C%83":"1f303",
            "%F0%9F%8C%84":"1f304",
            "%F0%9F%8C%85":"1f305",
            "%F0%9F%8C%86":"1f306",
            "%F0%9F%8C%87":"1f307",
            "%F0%9F%8C%88":"1f308",
            "%F0%9F%8C%89":"1f309",
            "%F0%9F%8C%8A":"1f30a",
            "%F0%9F%8C%8B":"1f30b",
            "%F0%9F%8C%8C":"1f30c",
            "%F0%9F%8C%8F":"1f30f",
            "%F0%9F%8C%91":"1f311",
            "%F0%9F%8C%93":"1f313",
            "%F0%9F%8C%94":"1f314",
            "%F0%9F%8C%95":"1f315",
            "%F0%9F%8C%99":"1f319",
            "%F0%9F%8C%9B":"1f31b",
            "%F0%9F%8C%9F":"1f31f",
            /* 			"%F0%9F%8C%A0":"1f320", */
            "%F0%9F%8C%B0":"1f330",
            "%F0%9F%8C%B1":"1f331",
            "%F0%9F%8C%B4":"1f334",
            "%F0%9F%8C%B5":"1f335",
            "%F0%9F%8C%B7":"1f337",
            "%F0%9F%8C%B8":"1f338",
            "%F0%9F%8C%B9":"1f339",
            "%F0%9F%8C%BA":"1f33a",
            "%F0%9F%8C%BB":"1f33b",
            "%F0%9F%8C%BC":"1f33c",
            "%F0%9F%8C%BD":"1f33d",
            "%F0%9F%8C%BE":"1f33e",
            "%F0%9F%8C%BF":"1f33f",
            "%F0%9F%8D%80":"1f340",
            "%F0%9F%8D%81":"1f341",
            "%F0%9F%8D%82":"1f342",
            "%F0%9F%8D%83":"1f343",
            "%F0%9F%8D%84":"1f344",
            "%F0%9F%8D%85":"1f345",
            "%F0%9F%8D%86":"1f346",
            "%F0%9F%8D%87":"1f347",
            "%F0%9F%8D%88":"1f348",
            "%F0%9F%8D%89":"1f349",
            "%F0%9F%8D%8A":"1f34a",
            "%F0%9F%8D%8C":"1f34c",
            "%F0%9F%8D%8D":"1f34d",
            "%F0%9F%8D%8E":"1f34e",
            "%F0%9F%8D%8F":"1f34f",
            "%F0%9F%8D%91":"1f351",
            "%F0%9F%8D%92":"1f352",
            "%F0%9F%8D%93":"1f353",
            "%F0%9F%8D%94":"1f354",
            "%F0%9F%8D%95":"1f355",
            "%F0%9F%8D%96":"1f356",
            "%F0%9F%8D%97":"1f357",
            "%F0%9F%8D%98":"1f358",
            "%F0%9F%8D%99":"1f359",
            "%F0%9F%8D%9A":"1f35a",
            "%F0%9F%8D%9B":"1f35b",
            "%F0%9F%8D%9C":"1f35c",
            "%F0%9F%8D%9D":"1f35d",
            "%F0%9F%8D%9E":"1f35e",
            "%F0%9F%8D%9F":"1f35f",
            "%F0%9F%8D%A0":"1f360",
            "%F0%9F%8D%A1":"1f361",
            "%F0%9F%8D%A2":"1f362",
            "%F0%9F%8D%A3":"1f363",
            "%F0%9F%8D%A4":"1f364",
            "%F0%9F%8D%A5":"1f365",
            "%F0%9F%8D%A6":"1f366",
            "%F0%9F%8D%A7":"1f367",
            "%F0%9F%8D%A8":"1f368",
            "%F0%9F%8D%A9":"1f369",
            "%F0%9F%8D%AA":"1f36a",
            "%F0%9F%8D%AB":"1f36b",
            "%F0%9F%8D%AC":"1f36c",
            "%F0%9F%8D%AD":"1f36d",
            "%F0%9F%8D%AE":"1f36e",
            "%F0%9F%8D%AF":"1f36f",
            "%F0%9F%8D%B0":"1f370",
            "%F0%9F%8D%B1":"1f371",
            "%F0%9F%8D%B2":"1f372",
            "%F0%9F%8D%B3":"1f373",
            "%F0%9F%8D%B4":"1f374",
            "%F0%9F%8D%B5":"1f375",
            "%F0%9F%8D%B6":"1f376",
            "%F0%9F%8D%B7":"1f377",
            "%F0%9F%8D%B8":"1f378",
            "%F0%9F%8D%B9":"1f379",
            "%F0%9F%8D%BA":"1f37a",
            "%F0%9F%8D%BB":"1f37b",
            "%F0%9F%8E%80":"1f380",
            "%F0%9F%8E%81":"1f381",
            "%F0%9F%8E%82":"1f382",
            "%F0%9F%8E%83":"1f383",
            "%F0%9F%8E%84":"1f384",
            "%F0%9F%8E%85":"1f385",
            "%F0%9F%8E%86":"1f386",
            "%F0%9F%8E%87":"1f387",
            "%F0%9F%8E%88":"1f388",
            "%F0%9F%8E%89":"1f389",
            "%F0%9F%8E%8A":"1f38a",
            "%F0%9F%8E%8B":"1f38b",
            "%F0%9F%8E%8C":"1f38c",
            "%F0%9F%8E%8D":"1f38d",
            "%F0%9F%8E%8E":"1f38e",
            "%F0%9F%8E%8F":"1f38f",
            "%F0%9F%8E%90":"1f390",
            "%F0%9F%8E%91":"1f391",
            "%F0%9F%8E%92":"1f392",
            "%F0%9F%8E%93":"1f393",
            "%F0%9F%8E%A0":"1f3a0",
            "%F0%9F%8E%A1":"1f3a1",
            "%F0%9F%8E%A2":"1f3a2",
            "%F0%9F%8E%A3":"1f3a3",
            "%F0%9F%8E%A4":"1f3a4",
            "%F0%9F%8E%A5":"1f3a5",
            "%F0%9F%8E%A6":"1f3a6",
            "%F0%9F%8E%A7":"1f3a7",
            "%F0%9F%8E%A8":"1f3a8",
            "%F0%9F%8E%A9":"1f3a9",
            "%F0%9F%8E%AA":"1f3aa",
            "%F0%9F%8E%AB":"1f3ab",
            "%F0%9F%8E%AC":"1f3ac",
            "%F0%9F%8E%AD":"1f3ad",
            "%F0%9F%8E%AE":"1f3ae",
            "%F0%9F%8E%AF":"1f3af",
            "%F0%9F%8E%B0":"1f3b0",
            "%F0%9F%8E%B1":"1f3b1",
            "%F0%9F%8E%B2":"1f3b2",
            "%F0%9F%8E%B3":"1f3b3",
            "%F0%9F%8E%B4":"1f3b4",
            "%F0%9F%8E%B5":"1f3b5",
            "%F0%9F%8E%B6":"1f3b6",
            "%F0%9F%8E%B7":"1f3b7",
            "%F0%9F%8E%B8":"1f3b8",
            "%F0%9F%8E%B9":"1f3b9",
            "%F0%9F%8E%BA":"1f3ba",
            "%F0%9F%8E%BB":"1f3bb",
            "%F0%9F%8E%BC":"1f3bc",
            "%F0%9F%8E%BD":"1f3bd",
            "%F0%9F%8E%BE":"1f3be",
            "%F0%9F%8E%BF":"1f3bf",
            "%F0%9F%8F%80":"1f3c0",
            "%F0%9F%8F%81":"1f3c1",
            "%F0%9F%8F%82":"1f3c2",
            "%F0%9F%8F%83":"1f3c3",
            "%F0%9F%8F%84":"1f3c4",
            "%F0%9F%8F%86":"1f3c6",
            "%F0%9F%8F%88":"1f3c8",
            "%F0%9F%8F%8A":"1f3ca",
            "%F0%9F%8F%A0":"1f3e0",
            "%F0%9F%8F%A1":"1f3e1",
            "%F0%9F%8F%A2":"1f3e2",
            "%F0%9F%8F%A3":"1f3e3",
            "%F0%9F%8F%A5":"1f3e5",
            "%F0%9F%8F%A6":"1f3e6",
            "%F0%9F%8F%A7":"1f3e7",
            "%F0%9F%8F%A8":"1f3e8",
            "%F0%9F%8F%A9":"1f3e9",
            "%F0%9F%8F%AA":"1f3ea",
            "%F0%9F%8F%AB":"1f3eb",
            "%F0%9F%8F%AC":"1f3ec",
            "%F0%9F%8F%AD":"1f3ed",
            "%F0%9F%8F%AE":"1f3ee",
            "%F0%9F%8F%AF":"1f3ef",
            "%F0%9F%8F%B0":"1f3f0",
            "%F0%9F%90%8C":"1f40c",
            "%F0%9F%90%8D":"1f40d",
            "%F0%9F%90%8E":"1f40e",
            "%F0%9F%90%91":"1f411",
            "%F0%9F%90%92":"1f412",
            "%F0%9F%90%94":"1f414",
            "%F0%9F%90%97":"1f417",
            "%F0%9F%90%98":"1f418",
            "%F0%9F%90%99":"1f419",
            "%F0%9F%90%9A":"1f41a",
            "%F0%9F%90%9B":"1f41b",
            "%F0%9F%90%9C":"1f41c",
            "%F0%9F%90%9D":"1f41d",
            "%F0%9F%90%9E":"1f41e",
            "%F0%9F%90%9F":"1f41f",
            "%F0%9F%90%A0":"1f420",
            "%F0%9F%90%A1":"1f421",
            "%F0%9F%90%A2":"1f422",
            "%F0%9F%90%A3":"1f423",
            "%F0%9F%90%A4":"1f424",
            "%F0%9F%90%A5":"1f425",
            "%F0%9F%90%A6":"1f426",
            "%F0%9F%90%A7":"1f427",
            "%F0%9F%90%A8":"1f428",
            "%F0%9F%90%A9":"1f429",
            "%F0%9F%90%AB":"1f42b",
            "%F0%9F%90%AC":"1f42c",
            "%F0%9F%90%AD":"1f42d",
            "%F0%9F%90%AE":"1f42e",
            "%F0%9F%90%AF":"1f42f",
            "%F0%9F%90%B0":"1f430",
            "%F0%9F%90%B1":"1f431",
            "%F0%9F%90%B2":"1f432",
            "%F0%9F%90%B3":"1f433",
            "%F0%9F%90%B4":"1f434",
            "%F0%9F%90%B5":"1f435",
            "%F0%9F%90%B6":"1f436",
            "%F0%9F%90%B7":"1f437",
            "%F0%9F%90%B8":"1f438",
            "%F0%9F%90%B9":"1f439",
            "%F0%9F%90%BA":"1f43a",
            "%F0%9F%90%BB":"1f43b",
            "%F0%9F%90%BC":"1f43c",
            "%F0%9F%90%BD":"1f43d",
            "%F0%9F%90%BE":"1f43e",
            "%F0%9F%91%80":"1f440",
            "%F0%9F%91%82":"1f442",
            "%F0%9F%91%83":"1f443",
            "%F0%9F%91%84":"1f444",
            "%F0%9F%91%85":"1f445",
            "%F0%9F%91%86":"1f446",
            "%F0%9F%91%87":"1f447",
            "%F0%9F%91%88":"1f448",
            "%F0%9F%91%89":"1f449",
            "%F0%9F%91%8A":"1f44a",
            "%F0%9F%91%8B":"1f44b",
            "%F0%9F%91%8C":"1f44c",
            "%F0%9F%91%8D":"1f44d",
            "%F0%9F%91%8E":"1f44e",
            "%F0%9F%91%8F":"1f44f",
            "%F0%9F%91%90":"1f450",
            "%F0%9F%91%91":"1f451",
            "%F0%9F%91%92":"1f452",
            "%F0%9F%91%93":"1f453",
            "%F0%9F%91%94":"1f454",
            "%F0%9F%91%95":"1f455",
            "%F0%9F%91%96":"1f456",
            "%F0%9F%91%97":"1f457",
            "%F0%9F%91%98":"1f458",
            "%F0%9F%91%99":"1f459",
            "%F0%9F%91%9A":"1f45a",
            "%F0%9F%91%9B":"1f45b",
            "%F0%9F%91%9C":"1f45c",
            "%F0%9F%91%9D":"1f45d",
            "%F0%9F%91%9E":"1f45e",
            "%F0%9F%91%9F":"1f45f",
            "%F0%9F%91%A0":"1f460",
            "%F0%9F%91%A1":"1f461",
            "%F0%9F%91%A2":"1f462",
            "%F0%9F%91%A3":"1f463",
            "%F0%9F%91%A4":"1f464",
            "%F0%9F%91%A6":"1f466",
            "%F0%9F%91%A7":"1f467",
            "%F0%9F%91%A8":"1f468",
            "%F0%9F%91%A9":"1f469",
            "%F0%9F%91%AA":"1f46a",
            "%F0%9F%91%AB":"1f46b",
            "%F0%9F%91%AE":"1f46e",
            "%F0%9F%91%AF":"1f46f",
            "%F0%9F%91%B0":"1f470",
            "%F0%9F%91%B1":"1f471",
            "%F0%9F%91%B2":"1f472",
            "%F0%9F%91%B3":"1f473",
            "%F0%9F%91%B4":"1f474",
            "%F0%9F%91%B5":"1f475",
            "%F0%9F%91%B6":"1f476",
            "%F0%9F%91%B7":"1f477",
            "%F0%9F%91%B8":"1f478",
            "%F0%9F%91%B9":"1f479",
            "%F0%9F%91%BA":"1f47a",
            "%F0%9F%91%BB":"1f47b",
            "%F0%9F%91%BC":"1f47c",
            "%F0%9F%91%BD":"1f47d",
            "%F0%9F%91%BE":"1f47e",
            "%F0%9F%91%BF":"1f47f",
            "%F0%9F%92%80":"1f480",
            "%F0%9F%92%81":"1f481",
            "%F0%9F%92%82":"1f482",
            "%F0%9F%92%83":"1f483",
            "%F0%9F%92%84":"1f484",
            "%F0%9F%92%85":"1f485",
            "%F0%9F%92%86":"1f486",
            "%F0%9F%92%87":"1f487",
            "%F0%9F%92%88":"1f488",
            "%F0%9F%92%89":"1f489",
            "%F0%9F%92%8A":"1f48a",
            "%F0%9F%92%8B":"1f48b",
            "%F0%9F%92%8C":"1f48c",
            "%F0%9F%92%8D":"1f48d",
            "%F0%9F%92%8E":"1f48e",
            "%F0%9F%92%8F":"1f48f",
            "%F0%9F%92%90":"1f490",
            "%F0%9F%92%91":"1f491",
            "%F0%9F%92%92":"1f492",
            "%F0%9F%92%93":"1f493",
            "%F0%9F%92%94":"1f494",
            "%F0%9F%92%95":"1f495",
            "%F0%9F%92%96":"1f496",
            "%F0%9F%92%97":"1f497",
            "%F0%9F%92%98":"1f498",
            "%F0%9F%92%99":"1f499",
            "%F0%9F%92%9A":"1f49a",
            "%F0%9F%92%9B":"1f49b",
            "%F0%9F%92%9C":"1f49c",
            "%F0%9F%92%9D":"1f49d",
            "%F0%9F%92%9E":"1f49e",
            "%F0%9F%92%9F":"1f49f",
            "%F0%9F%92%A0":"1f4a0",
            "%F0%9F%92%A1":"1f4a1",
            "%F0%9F%92%A2":"1f4a2",
            "%F0%9F%92%A3":"1f4a3",
            "%F0%9F%92%A4":"1f4a4",
            "%F0%9F%92%A5":"1f4a5",
            "%F0%9F%92%A6":"1f4a6",
            "%F0%9F%92%A7":"1f4a7",
            "%F0%9F%92%A8":"1f4a8",
            "%F0%9F%92%A9":"1f4a9",
            "%F0%9F%92%AA":"1f4aa",
            "%F0%9F%92%AB":"1f4ab",
            "%F0%9F%92%AC":"1f4ac",
            "%F0%9F%92%AE":"1f4ae",
            "%F0%9F%92%AF":"1f4af",
            "%F0%9F%92%B0":"1f4b0",
            "%F0%9F%92%B1":"1f4b1",
            "%F0%9F%92%B2":"1f4b2",
            "%F0%9F%92%B3":"1f4b3",
            "%F0%9F%92%B4":"1f4b4",
            "%F0%9F%92%B5":"1f4b5",
            "%F0%9F%92%B8":"1f4b8",
            "%F0%9F%92%B9":"1f4b9",
            "%F0%9F%92%BA":"1f4ba",
            "%F0%9F%92%BB":"1f4bb",
            "%F0%9F%92%BC":"1f4bc",
            "%F0%9F%92%BD":"1f4bd",
            "%F0%9F%92%BE":"1f4be",
            "%F0%9F%92%BF":"1f4bf",
            "%F0%9F%93%80":"1f4c0",
            "%F0%9F%93%81":"1f4c1",
            "%F0%9F%93%82":"1f4c2",
            "%F0%9F%93%83":"1f4c3",
            "%F0%9F%93%84":"1f4c4",
            "%F0%9F%93%85":"1f4c5",
            "%F0%9F%93%86":"1f4c6",
            "%F0%9F%93%87":"1f4c7",
            "%F0%9F%93%88":"1f4c8",
            "%F0%9F%93%89":"1f4c9",
            "%F0%9F%93%8A":"1f4ca",
            "%F0%9F%93%8B":"1f4cb",
            "%F0%9F%93%8C":"1f4cc",
            "%F0%9F%93%8D":"1f4cd",
            "%F0%9F%93%8E":"1f4ce",
            "%F0%9F%93%8F":"1f4cf",
            "%F0%9F%93%90":"1f4d0",
            "%F0%9F%93%91":"1f4d1",
            "%F0%9F%93%92":"1f4d2",
            "%F0%9F%93%93":"1f4d3",
            "%F0%9F%93%94":"1f4d4",
            "%F0%9F%93%95":"1f4d5",
            "%F0%9F%93%96":"1f4d6",
            "%F0%9F%93%97":"1f4d7",
            "%F0%9F%93%98":"1f4d8",
            "%F0%9F%93%99":"1f4d9",
            "%F0%9F%93%9A":"1f4da",
            "%F0%9F%93%9B":"1f4db",
            "%F0%9F%93%9C":"1f4dc",
            "%F0%9F%93%9D":"1f4dd",
            "%F0%9F%93%9E":"1f4de",
            "%F0%9F%93%9F":"1f4df",
            "%F0%9F%93%A0":"1f4e0",
            "%F0%9F%93%A1":"1f4e1",
            "%F0%9F%93%A2":"1f4e2",
            "%F0%9F%93%A3":"1f4e3",
            "%F0%9F%93%A4":"1f4e4",
            "%F0%9F%93%A5":"1f4e5",
            "%F0%9F%93%A6":"1f4e6",
            "%F0%9F%93%A7":"1f4e7",
            "%F0%9F%93%A8":"1f4e8",
            "%F0%9F%93%A9":"1f4e9",
            "%F0%9F%93%AA":"1f4ea",
            "%F0%9F%93%AB":"1f4eb",
            "%F0%9F%93%AE":"1f4ee",
            "%F0%9F%93%B0":"1f4f0",
            "%F0%9F%93%B1":"1f4f1",
            "%F0%9F%93%B2":"1f4f2",
            "%F0%9F%93%B3":"1f4f3",
            "%F0%9F%93%B4":"1f4f4",
            "%F0%9F%93%B6":"1f4f6",
            "%F0%9F%93%B7":"1f4f7",
            "%F0%9F%93%B9":"1f4f9",
            "%F0%9F%93%BA":"1f4fa",
            "%F0%9F%93%BB":"1f4fb",
            "%F0%9F%93%BC":"1f4fc",
            "%F0%9F%94%83":"1f503",
            "%F0%9F%94%8A":"1f50a",
            "%F0%9F%94%8B":"1f50b",
            "%F0%9F%94%8C":"1f50c",
            "%F0%9F%94%8D":"1f50d",
            "%F0%9F%94%8E":"1f50e",
            "%F0%9F%94%8F":"1f50f",
            "%F0%9F%94%90":"1f510",
            "%F0%9F%94%91":"1f511",
            "%F0%9F%94%92":"1f512",
            "%F0%9F%94%93":"1f513",
            "%F0%9F%94%94":"1f514",
            "%F0%9F%94%96":"1f516",
            "%F0%9F%94%97":"1f517",
            "%F0%9F%94%98":"1f518",
            "%F0%9F%94%99":"1f519",
            "%F0%9F%94%9A":"1f51a",
            "%F0%9F%94%9B":"1f51b",
            "%F0%9F%94%9C":"1f51c",
            "%F0%9F%94%9D":"1f51d",
            "%F0%9F%94%9E":"1f51e",
            "%F0%9F%94%9F":"1f51f",
            "%F0%9F%94%A0":"1f520",
            "%F0%9F%94%A1":"1f521",
            "%F0%9F%94%A2":"1f522",
            "%F0%9F%94%A3":"1f523",
            "%F0%9F%94%A4":"1f524",
            "%F0%9F%94%A5":"1f525",
            "%F0%9F%94%A6":"1f526",
            "%F0%9F%94%A7":"1f527",
            "%F0%9F%94%A8":"1f528",
            "%F0%9F%94%A9":"1f529",
            "%F0%9F%94%AA":"1f52a",
            "%F0%9F%94%AB":"1f52b",
            "%F0%9F%94%AE":"1f52e",
            "%F0%9F%94%AF":"1f52f",
            "%F0%9F%94%B0":"1f530",
            "%F0%9F%94%B1":"1f531",
            "%F0%9F%94%B2":"1f532",
            "%F0%9F%94%B3":"1f533",
            "%F0%9F%94%B4":"1f534",
            "%F0%9F%94%B5":"1f535",
            "%F0%9F%94%B6":"1f536",
            "%F0%9F%94%B7":"1f537",
            "%F0%9F%94%B8":"1f538",
            "%F0%9F%94%B9":"1f539",
            "%F0%9F%94%BA":"1f53a",
            "%F0%9F%94%BB":"1f53b",
            "%F0%9F%94%BC":"1f53c",
            "%F0%9F%94%BD":"1f53d",
            "%F0%9F%95%90":"1f550",
            "%F0%9F%95%91":"1f551",
            "%F0%9F%95%92":"1f552",
            "%F0%9F%95%93":"1f553",
            "%F0%9F%95%94":"1f554",
            "%F0%9F%95%95":"1f555",
            "%F0%9F%95%96":"1f556",
            "%F0%9F%95%97":"1f557",
            "%F0%9F%95%98":"1f558",
            "%F0%9F%95%99":"1f559",
            "%F0%9F%95%9A":"1f55a",
            "%F0%9F%95%9B":"1f55b",
            "%F0%9F%97%BB":"1f5fb",
            "%F0%9F%97%BC":"1f5fc",
            "%F0%9F%97%BD":"1f5fd",
            "%F0%9F%97%BE":"1f5fe",
            "%F0%9F%97%BF":"1f5ff", //CRV Start of 6th Section
            "%F0%9F%98%80":"1f600",
            "%F0%9F%98%87":"1f607",
            "%F0%9F%98%88":"1f608",
            "%F0%9F%98%8E":"1f60e",
            "%F0%9F%98%90":"1f610",
            "%F0%9F%98%91":"1f611",
            "%F0%9F%98%95":"1f615",
            "%F0%9F%98%97":"1f617",
            "%F0%9F%98%99":"1f619",
            "%F0%9F%98%9B":"1f61b",
            "%F0%9F%98%9F":"1f61f",
            "%F0%9F%98%A6":"1f626",
            "%F0%9F%98%A7":"1f627",
            "%F0%9F%98%AC":"1f62c",
            "%F0%9F%98%AE":"1f62e",
            "%F0%9F%98%AF":"1f62f",
            "%F0%9F%98%B4":"1f634",
            "%F0%9F%98%B6":"1f636",  //CRV Start of 6b section
            "%F0%9F%9A%81":"1f681",
            "%F0%9F%9A%82":"1f682",
            "%F0%9F%9A%86":"1f686",
            "%F0%9F%9A%88":"1f688",
            "%F0%9F%9A%8A":"1f68a",
            "%F0%9F%9A%8D":"1f68d",
            "%F0%9F%9A%8E":"1f68e",
            "%F0%9F%9A%90":"1f690",
            "%F0%9F%9A%94":"1f694",
            "%F0%9F%9A%96":"1f696",
            "%F0%9F%9A%98":"1f698",
            "%F0%9F%9A%9B":"1f69b",
            "%F0%9F%9A%9C":"1f69c",
            "%F0%9F%9A%9D":"1f69d",
            "%F0%9F%9A%9E":"1f69e",
            "%F0%9F%9A%9F":"1f69f",
            "%F0%9F%9A%A0":"1f6a0",
            "%F0%9F%9A%A1":"1f6a1",
            "%F0%9F%9A%A3":"1f6a3",
            "%F0%9F%9A%A6":"1f6a6",
            "%F0%9F%9A%AE":"1f6ae",
            "%F0%9F%9A%AF":"1f6af",
            "%F0%9F%9A%B0":"1f6b0",
            "%F0%9F%9A%B1":"1f6b1",
            "%F0%9F%9A%B3":"1f6b3",
            "%F0%9F%9A%B4":"1f6b4",
            "%F0%9F%9A%B5":"1f6b5",
            "%F0%9F%9A%B7":"1f6b7",
            "%F0%9F%9A%B8":"1f6b8",
            "%F0%9F%9A%BF":"1f6bf",
            "%F0%9F%9B%81":"1f6c1",
            "%F0%9F%9B%82":"1f6c2",
            "%F0%9F%9B%83":"1f6c3",
            "%F0%9F%9B%84":"1f6c4",
            "%F0%9F%9B%85":"1f6c5", //CRV start of 7th section
            "%F0%9F%8C%8D":"1f30d",
            "%F0%9F%8C%8E":"1f30e",
            "%F0%9F%8C%90":"1f310",
            "%F0%9F%8C%92":"1f312",
            "%F0%9F%8C%96":"1f316",
            "%F0%9F%8C%97":"1f317",
            "%F0%9F%8C%98":"1f318",
            "%F0%9F%8C%9A":"1f31a",
            "%F0%9F%8C%9C":"1f31c",
            "%F0%9F%8C%9D":"1f31d",
            "%F0%9F%8C%9E":"1f31e",
            "%F0%9F%8C%B2":"1f332",
            "%F0%9F%8C%B3":"1f333",
            "%F0%9F%8D%8B":"1f34b",
            "%F0%9F%8D%90":"1f350",
            "%F0%9F%8D%BC":"1f37c",
            "%F0%9F%8F%87":"1f3c7",
            "%F0%9F%8F%89":"1f3c9",
            "%F0%9F%8F%A4":"1f3e4",
            "%F0%9F%90%80":"1f400",
            "%F0%9F%90%81":"1f401",
            "%F0%9F%90%82":"1f402",
            "%F0%9F%90%83":"1f403",
            "%F0%9F%90%84":"1f404",
            "%F0%9F%90%85":"1f405",
            "%F0%9F%90%86":"1f406",
            "%F0%9F%90%87":"1f407",
            "%F0%9F%90%88":"1f408",
            "%F0%9F%90%89":"1f409",
            "%F0%9F%90%8A":"1f40a",
            "%F0%9F%90%8B":"1f40b",
            "%F0%9F%90%8F":"1f40f",
            "%F0%9F%90%90":"1f410",
            "%F0%9F%90%93":"1f413",
            "%F0%9F%90%95":"1f415",
            "%F0%9F%90%96":"1f416",
            "%F0%9F%90%AA":"1f42a",
            "%F0%9F%91%A5":"1f465",
            "%F0%9F%91%AC":"1f46c",
            "%F0%9F%91%AD":"1f46d",
            "%F0%9F%92%AD":"1f4ad",
            "%F0%9F%92%B6":"1f4b6",
            "%F0%9F%92%B7":"1f4b7",
            "%F0%9F%93%AC":"1f4ec",
            "%F0%9F%93%AD":"1f4ed",
            "%F0%9F%93%AF":"1f4ef",
            "%F0%9F%93%B5":"1f4f5",
            "%F0%9F%94%80":"1f500",
            "%F0%9F%94%81":"1f501",
            "%F0%9F%94%82":"1f502",
            "%F0%9F%94%84":"1f504",
            "%F0%9F%94%85":"1f505",
            "%F0%9F%94%86":"1f506",
            "%F0%9F%94%87":"1f507",
            "%F0%9F%94%89":"1f509",
            "%F0%9F%94%95":"1f515",
            "%F0%9F%94%AC":"1f52c",
            "%F0%9F%94%AD":"1f52d",
            "%F0%9F%95%9C":"1f55c",
            "%F0%9F%95%9D":"1f55d",
            "%F0%9F%95%9E":"1f55e",
            "%F0%9F%95%9F":"1f55f",
            "%F0%9F%95%A0":"1f560",
            "%F0%9F%95%A1":"1f561",
            "%F0%9F%95%A2":"1f562",
            "%F0%9F%95%A3":"1f563",
            "%F0%9F%95%A4":"1f564",
            "%F0%9F%95%A5":"1f565",
            "%F0%9F%95%A6":"1f566",
            "%F0%9F%95%A7":"1f567"



        }, patterns = [],
        metachars = /[[\]{}()*+?.\\|^$\-,&#\s]/g;

    ////console.log('emoji: ');
    ////console.log(emoji);
    // build a regex pattern for each defined property
    for (var i in emoji) {
        if (emoji.hasOwnProperty(i)){ // escape metacharacters
            patterns.push('('+i.replace(metachars, "\\$&")+')');
        }
    }

    // build the regular expression and replace
    return text.replace(new RegExp(patterns.join('|'),'g'), function (match) {
        return typeof emoji[match] != 'undefined' ?
            '<img height="18px" width="18px" class="emoji adjustedSpriteForMessageDisplay spriteEMOJI sprite-' + emoji[match] + '" data-textvalue="' + encodeURIComponent(match) + '" src="' + imgPlaceHolderURL + '"/>' :
            match;
    });
}


function buildEmojiAndEmoticonSelector()
{
    var html='';
    //KL WANTS TO LEAVE THESE TITLEHOLDERS IN BECAUSE THE LAST ROW OF 5 LOOKS AWKWARD WITH THE FIRST ROW OF SIX EMOJIS.
    //html +='<span class="titleHolder">Emoticons</span>';

    var emoticons = {
        ':-)' : 'smile',
        ':-('  : 'frown',
        ';-)'  : 'wink',
        ':-P'  : 'tongue',
        '=-O' : 'surprised',
        ':-*' : 'kiss',
        ':O' : 'yelling',
        'B-)' : 'cool',
        ':-[' : 'embarrassed',
        'O:-)' : 'angel',
        ':&#39;(' : 'cry',
        ':-X' : 'lipsaresealed',
        ':-D' : 'laughing',
        'o_O' : 'confused',
        '&lt;3' : 'heart',
        'x-(' : 'angry',
        ':-/' : 'smirk',
        ':-I' : 'pokerface',
        ':-\\' : 'undecided',
        ':-$' : 'moneymouth',
        ':-!' : 'footinmouth'
    };

    $.each(emoticons, function(index, key){
        //KL REMOVED  onclick="addThisEmoticon(this) FROM THE HTML ELEMENT BECAUSE INLINE JAVASCRIPT IS NOT ALLOWED ON ELEMENT INSERTED VIA CONTENT SCRIPTS
        //HAD TO SWAP EMOTICON CLASS FOR GEMOTICON BECAUSE FB HAD CSS FOR EMOTICON
        html += '<div class="emojiHolder""><img class="gEmoticon gtextEmoticon eeselectoritem mt_sprite sprite-' + key + '" data-textvalue="' + index + '" src="' + imgPlaceHolderURL + '"></div>';
    });

    //'<img class="emoji lazy eeselectoritem" data-textvalue="' + index + '"  data-src="' + pngPath + key + '" data-src-retina="' + pngPath + key + '" src="' + lazyImage + '">'

    //html +='<span class="titleHolder">Emojis</span>';

    var emoji = {
        "%F0%9F%98%81":"1f601",
        "%F0%9F%98%82":"1f602",
        "%F0%9F%98%83":"1f603",
        "%F0%9F%98%84":"1f604",
        "%F0%9F%98%85":"1f605",
        "%F0%9F%98%86":"1f606",
        "%F0%9F%98%89":"1f609",
        "%F0%9F%98%8A":"1f60a",
        "%F0%9F%98%8B":"1f60b",
        "%F0%9F%98%8C":"1f60c",
        "%F0%9F%98%8D":"1f60d",
        "%F0%9F%98%8F":"1f60f",
        "%F0%9F%98%92":"1f612",
        "%F0%9F%98%93":"1f613",
        "%F0%9F%98%94":"1f614",
        "%F0%9F%98%96":"1f616",
        "%F0%9F%98%98":"1f618",
        "%F0%9F%98%9A":"1f61a",
        "%F0%9F%98%9C":"1f61c",
        "%F0%9F%98%9D":"1f61d",
        "%F0%9F%98%9E":"1f61e",
        "%F0%9F%98%A0":"1f620",
        "%F0%9F%98%A1":"1f621",
        "%F0%9F%98%A2":"1f622",
        "%F0%9F%98%A3":"1f623",
        "%F0%9F%98%A4":"1f624",
        "%F0%9F%98%A5":"1f625",
        "%F0%9F%98%A8":"1f628",
        "%F0%9F%98%A9":"1f629",
        "%F0%9F%98%AA":"1f62a",
        "%F0%9F%98%AB":"1f62b",
        "%F0%9F%98%AD":"1f62d",
        "%F0%9F%98%B0":"1f630",
        "%F0%9F%98%B1":"1f631",
        "%F0%9F%98%B2":"1f632",
        "%F0%9F%98%B3":"1f633",
        "%F0%9F%98%B5":"1f635",
        "%F0%9F%98%B7":"1f637",
        "%F0%9F%98%B8":"1f638",
        "%F0%9F%98%B9":"1f639",
        "%F0%9F%98%BA":"1f63a",
        "%F0%9F%98%BB":"1f63b",
        "%F0%9F%98%BC":"1f63c",
        "%F0%9F%98%BD":"1f63d",
        "%F0%9F%98%BE":"1f63e",
        "%F0%9F%98%BF":"1f63f",
        "%F0%9F%99%80":"1f640",
        "%F0%9F%99%85":"1f645",
        "%F0%9F%99%86":"1f646",
        "%F0%9F%99%87":"1f647",
        "%F0%9F%99%88":"1f648",
        "%F0%9F%99%89":"1f649",
        "%F0%9F%99%8A":"1f64a",
        "%F0%9F%99%8B":"1f64b",
        "%F0%9F%99%8C":"1f64c",
        "%F0%9F%99%8D":"1f64d",
        "%F0%9F%99%8E":"1f64e",
        "%F0%9F%99%8F":"1f64f",  //CRV START OF SECOND GROUP
        "%E2%9C%82":"2702",
        "%E2%9C%85":"2705",
        "%E2%9C%88":"2708",
        "%E2%9C%89":"2709",
        "%E2%9C%8A":"270a",
        "%E2%9C%8B":"270b",
        "%E2%9C%8C":"270c",
        "%E2%9C%8F":"270f",
        "%E2%9C%92":"2712",
        "%E2%9C%94":"2714",
        "%E2%9C%96":"2716",
        "%E2%9C%A8":"2728",
        "%E2%9C%B3":"2733",
        "%E2%9C%B4":"2734",
        "%E2%9D%84":"2744",
        "%E2%9D%87":"2747",
        "%E2%9D%8C":"274c",
        "%E2%9D%8E":"274e",
        "%E2%9D%93":"2753",
        "%E2%9D%94":"2754",
        "%E2%9D%95":"2755",
        "%E2%9D%97":"2757",
        "%E2%9D%A4":"2764",
        "%E2%9E%95":"2795",
        "%E2%9E%96":"2796",
        "%E2%9E%97":"2797",
        "%E2%9E%A1":"27a1",
        "%E2%9E%B0":"27b0",
        "%F0%9F%9A%80":"1f680",
        "%F0%9F%9A%83":"1f683",
        "%F0%9F%9A%84":"1f684",
        "%F0%9F%9A%85":"1f685",
        "%F0%9F%9A%87":"1f687",
        "%F0%9F%9A%89":"1f689",
        "%F0%9F%9A%8C":"1f68c",
        "%F0%9F%9A%8F":"1f68f",
        "%F0%9F%9A%91":"1f691",
        "%F0%9F%9A%92":"1f692",
        "%F0%9F%9A%93":"1f693",
        "%F0%9F%9A%95":"1f695",
        "%F0%9F%9A%97":"1f697",
        "%F0%9F%9A%99":"1f699",
        "%F0%9F%9A%9A":"1f69a",
        "%F0%9F%9A%A2":"1f6a2",
        "%F0%9F%9A%A4":"1f6a4",
        "%F0%9F%9A%A5":"1f6a5",
        "%F0%9F%9A%A7":"1f6a7",
        "%F0%9F%9A%A8":"1f6a8",
        "%F0%9F%9A%A9":"1f6a9",
        "%F0%9F%9A%AA":"1f6aa",
        "%F0%9F%9A%AB":"1f6ab",
        "%F0%9F%9A%AC":"1f6ac",
        "%F0%9F%9A%AD":"1f6ad",
        "%F0%9F%9A%B2":"1f6b2",
        "%F0%9F%9A%B6":"1f6b6",
        "%F0%9F%9A%B9":"1f6b9",
        "%F0%9F%9A%BA":"1f6ba",
        "%F0%9F%9A%BB":"1f6bb",
        "%F0%9F%9A%BC":"1f6bc",
        "%F0%9F%9A%BD":"1f6bd",
        "%F0%9F%9A%BE":"1f6be",
        "%F0%9F%9B%80":"1f6c0",
        "%E2%93%82":"24c2",  //CRV Start of third section.
        "%F0%9F%85%B0":"1f170",
        "%F0%9F%85%B1":"1f171",
        "%F0%9F%85%BE":"1f17e",
        "%F0%9F%85%BF":"1f17f",
        "%F0%9F%86%8E":"1f18e",
        "%F0%9F%86%91":"1f191",
        "%F0%9F%86%92":"1f192",
        "%F0%9F%86%93":"1f193",
        "%F0%9F%86%94":"1f194",
        "%F0%9F%86%95":"1f195",
        "%F0%9F%86%96":"1f196",
        "%F0%9F%86%97":"1f197",
        "%F0%9F%86%98":"1f198",
        "%F0%9F%86%99":"1f199",
        "%F0%9F%86%9A":"1f19a",
        "%F0%9F%87%A9%F0%9F%87%AA":"1f1e9-1f1ea",
        "%F0%9F%87%AC%F0%9F%87%A7":"1f1ec-1f1e7",
        "%F0%9F%87%A8%F0%9F%87%B3":"1f1e8-1f1f3",
        "%F0%9F%87%AF%F0%9F%87%B5":"1f1ef-1f1f5",
        "%F0%9F%87%B0%F0%9F%87%B7":"1f1f0-1f1f7",
        "%F0%9F%87%AB%F0%9F%87%B7":"1f1eb-1f1f7",
        "%F0%9F%87%AA%F0%9F%87%B8":"1f1ea-1f1f8",
        "%F0%9F%87%AE%F0%9F%87%B9":"1f1ee-1f1f9",
        "%F0%9F%87%BA%F0%9F%87%B8":"1f1fa-1f1f8",
        "%F0%9F%87%B7%F0%9F%87%BA":"1f1f7-1f1fa",
        "%F0%9F%88%81":"1f201",
        "%F0%9F%88%82":"1f202",
        "%F0%9F%88%9A":"1f21a",
        "%F0%9F%88%AF":"1f22f",
        "%F0%9F%88%B2":"1f232",
        "%F0%9F%88%B3":"1f233",
        "%F0%9F%88%B4":"1f234",
        "%F0%9F%88%B5":"1f235",
        "%F0%9F%88%B6":"1f236",
        "%F0%9F%88%B7":"1f237",
        "%F0%9F%88%B8":"1f238",
        "%F0%9F%88%B9":"1f239",
        "%F0%9F%88%BA":"1f23a",
        "%F0%9F%89%90":"1f250",
        "%F0%9F%89%91":"1f251", //CRV Start of the 5th section
        "%C2%A9":"00a9",
        "%C2%AE":"00ae",
        "%E2%80%BC":"203c",
        "%E2%81%89":"2049",
        "%38%E2%83%A3":"0038",
        "%39%E2%83%A3":"0039",
        "%37%E2%83%A3":"0037",
        "%36%E2%83%A3":"0036",
        "%31%E2%83%A3":"0031",
        "%30%E2%83%A3":"0030",
        "%32%E2%83%A3":"0032",
        "%33%E2%83%A3":"0033",
        "%35%E2%83%A3":"0035",
        "%34%E2%83%A3":"0034",
        "%23%E2%83%A3":"0023",
        "%E2%84%A2":"2122",
        "%E2%84%B9":"2139",
        "%E2%86%94":"2194",
        "%E2%86%95":"2195",
        "%E2%86%96":"2196",
        "%E2%86%97":"2197",
        "%E2%86%98":"2198",
        "%E2%86%99":"2199",
        "%E2%86%A9":"21a9",
        "%E2%86%AA":"21aa",
        "%E2%8C%9A":"231a",
        "%E2%8C%9B":"231b",
        "%E2%8F%A9":"23e9",
        "%E2%8F%AA":"23ea",
        "%E2%8F%AB":"23eb",
        "%E2%8F%AC":"23ec",
        "%E2%8F%B0":"23f0",
        "%E2%8F%B3":"23f3",
        "%E2%96%AA":"25aa",
        "%E2%96%AB":"25ab",
        "%E2%96%B6":"25b6",
        "%E2%97%80":"25c0",
        "%E2%97%BB":"25fb",
        "%E2%97%BC":"25fc",
        "%E2%97%BD":"25fd",
        "%E2%97%BE":"25fe",
        "%E2%98%80":"2600",
        "%E2%98%81":"2601",
        "%E2%98%8E":"260e",
        "%E2%98%91":"2611",
        "%E2%98%94":"2614",
        "%E2%98%95":"2615",
        "%E2%98%9D":"261d",
        "%E2%98%BA":"263a",
        "%E2%99%88":"2648",
        "%E2%99%89":"2649",
        "%E2%99%8A":"264a",
        "%E2%99%8B":"264b",
        "%E2%99%8C":"264c",
        "%E2%99%8D":"264d",
        "%E2%99%8E":"264e",
        "%E2%99%8F":"264f",
        "%E2%99%90":"2650",
        "%E2%99%91":"2651",
        "%E2%99%92":"2652",
        "%E2%99%93":"2653",
        "%E2%99%A0":"2660",
        "%E2%99%A3":"2663",
        "%E2%99%A5":"2665",
        "%E2%99%A6":"2666",
        "%E2%99%A8":"2668",
        "%E2%99%BB":"267b",
        "%E2%99%BF":"267f",
        "%E2%9A%93":"2693",
        "%E2%9A%A0":"26a0",
        "%E2%9A%A1":"26a1",
        "%E2%9A%AA":"26aa",
        "%E2%9A%AB":"26ab",
        "%E2%9A%BD":"26bd",
        "%E2%9A%BE":"26be",
        "%E2%9B%84":"26c4",
        "%E2%9B%85":"26c5",
        "%E2%9B%8E":"26ce",
        "%E2%9B%94":"26d4",
        "%E2%9B%AA":"26ea",
        "%E2%9B%B2":"26f2",
        "%E2%9B%B3":"26f3",
        "%E2%9B%B5":"26f5",
        "%E2%9B%BA":"26fa",
        "%E2%9B%BD":"26fd",
        "%E2%A4%B4":"2934",
        "%E2%A4%B5":"2935",
        "%E2%AC%85":"2b05",
        "%E2%AC%86":"2b06",
        "%E2%AC%87":"2b07",
        "%E2%AC%9B":"2b1b",
        "%E2%AC%9C":"2b1c",
        "%E2%AD%90":"2b50",
        "%E2%AD%95":"2b55",
        "%E3%80%B0":"3030",
        "%E3%80%BD":"303d",
        "%E3%8A%97":"3297",
        "%E3%8A%99":"3299",
        "%F0%9F%80%84":"1f004",
        "%F0%9F%83%8F":"1f0cf",
        "%F0%9F%8C%80":"1f300",
        "%F0%9F%8C%81":"1f301",
        "%F0%9F%8C%82":"1f302",
        "%F0%9F%8C%83":"1f303",
        "%F0%9F%8C%84":"1f304",
        "%F0%9F%8C%85":"1f305",
        "%F0%9F%8C%86":"1f306",
        "%F0%9F%8C%87":"1f307",
        "%F0%9F%8C%88":"1f308",
        "%F0%9F%8C%89":"1f309",
        "%F0%9F%8C%8A":"1f30a",
        "%F0%9F%8C%8B":"1f30b",
        "%F0%9F%8C%8C":"1f30c",
        "%F0%9F%8C%8F":"1f30f",
        "%F0%9F%8C%91":"1f311",
        "%F0%9F%8C%93":"1f313",
        "%F0%9F%8C%94":"1f314",
        "%F0%9F%8C%95":"1f315",
        "%F0%9F%8C%99":"1f319",
        "%F0%9F%8C%9B":"1f31b",
        "%F0%9F%8C%9F":"1f31f",
        /* "%F0%9F%8C%A0":"1f320", */
        "%F0%9F%8C%B0":"1f330",
        "%F0%9F%8C%B1":"1f331",
        "%F0%9F%8C%B4":"1f334",
        "%F0%9F%8C%B5":"1f335",
        "%F0%9F%8C%B7":"1f337",
        "%F0%9F%8C%B8":"1f338",
        "%F0%9F%8C%B9":"1f339",
        "%F0%9F%8C%BA":"1f33a",
        "%F0%9F%8C%BB":"1f33b",
        "%F0%9F%8C%BC":"1f33c",
        "%F0%9F%8C%BD":"1f33d",
        "%F0%9F%8C%BE":"1f33e",
        "%F0%9F%8C%BF":"1f33f",
        "%F0%9F%8D%80":"1f340",
        "%F0%9F%8D%81":"1f341",
        "%F0%9F%8D%82":"1f342",
        "%F0%9F%8D%83":"1f343",
        "%F0%9F%8D%84":"1f344",
        "%F0%9F%8D%85":"1f345",
        "%F0%9F%8D%86":"1f346",
        "%F0%9F%8D%87":"1f347",
        "%F0%9F%8D%88":"1f348",
        "%F0%9F%8D%89":"1f349",
        "%F0%9F%8D%8A":"1f34a",
        "%F0%9F%8D%8C":"1f34c",
        "%F0%9F%8D%8D":"1f34d",
        "%F0%9F%8D%8E":"1f34e",
        "%F0%9F%8D%8F":"1f34f",
        "%F0%9F%8D%91":"1f351",
        "%F0%9F%8D%92":"1f352",
        "%F0%9F%8D%93":"1f353",
        "%F0%9F%8D%94":"1f354",
        "%F0%9F%8D%95":"1f355",
        "%F0%9F%8D%96":"1f356",
        "%F0%9F%8D%97":"1f357",
        "%F0%9F%8D%98":"1f358",
        "%F0%9F%8D%99":"1f359",
        "%F0%9F%8D%9A":"1f35a",
        "%F0%9F%8D%9B":"1f35b",
        "%F0%9F%8D%9C":"1f35c",
        "%F0%9F%8D%9D":"1f35d",
        "%F0%9F%8D%9E":"1f35e",
        "%F0%9F%8D%9F":"1f35f",
        "%F0%9F%8D%A0":"1f360",
        "%F0%9F%8D%A1":"1f361",
        "%F0%9F%8D%A2":"1f362",
        "%F0%9F%8D%A3":"1f363",
        "%F0%9F%8D%A4":"1f364",
        "%F0%9F%8D%A5":"1f365",
        "%F0%9F%8D%A6":"1f366",
        "%F0%9F%8D%A7":"1f367",
        "%F0%9F%8D%A8":"1f368",
        "%F0%9F%8D%A9":"1f369",
        "%F0%9F%8D%AA":"1f36a",
        "%F0%9F%8D%AB":"1f36b",
        "%F0%9F%8D%AC":"1f36c",
        "%F0%9F%8D%AD":"1f36d",
        "%F0%9F%8D%AE":"1f36e",
        "%F0%9F%8D%AF":"1f36f",
        "%F0%9F%8D%B0":"1f370",
        "%F0%9F%8D%B1":"1f371",
        "%F0%9F%8D%B2":"1f372",
        "%F0%9F%8D%B3":"1f373",
        "%F0%9F%8D%B4":"1f374",
        "%F0%9F%8D%B5":"1f375",
        "%F0%9F%8D%B6":"1f376",
        "%F0%9F%8D%B7":"1f377",
        "%F0%9F%8D%B8":"1f378",
        "%F0%9F%8D%B9":"1f379",
        "%F0%9F%8D%BA":"1f37a",
        "%F0%9F%8D%BB":"1f37b",
        "%F0%9F%8E%80":"1f380",
        "%F0%9F%8E%81":"1f381",
        "%F0%9F%8E%82":"1f382",
        "%F0%9F%8E%83":"1f383",
        "%F0%9F%8E%84":"1f384",
        "%F0%9F%8E%85":"1f385",
        "%F0%9F%8E%86":"1f386",
        "%F0%9F%8E%87":"1f387",
        "%F0%9F%8E%88":"1f388",
        "%F0%9F%8E%89":"1f389",
        "%F0%9F%8E%8A":"1f38a",
        "%F0%9F%8E%8B":"1f38b",
        "%F0%9F%8E%8C":"1f38c",
        "%F0%9F%8E%8D":"1f38d",
        "%F0%9F%8E%8E":"1f38e",
        "%F0%9F%8E%8F":"1f38f",
        "%F0%9F%8E%90":"1f390",
        "%F0%9F%8E%91":"1f391",
        "%F0%9F%8E%92":"1f392",
        "%F0%9F%8E%93":"1f393",
        "%F0%9F%8E%A0":"1f3a0",
        "%F0%9F%8E%A1":"1f3a1",
        "%F0%9F%8E%A2":"1f3a2",
        "%F0%9F%8E%A3":"1f3a3",
        "%F0%9F%8E%A4":"1f3a4",
        "%F0%9F%8E%A5":"1f3a5",
        "%F0%9F%8E%A6":"1f3a6",
        "%F0%9F%8E%A7":"1f3a7",
        "%F0%9F%8E%A8":"1f3a8",
        "%F0%9F%8E%A9":"1f3a9",
        "%F0%9F%8E%AA":"1f3aa",
        "%F0%9F%8E%AB":"1f3ab",
        "%F0%9F%8E%AC":"1f3ac",
        "%F0%9F%8E%AD":"1f3ad",
        "%F0%9F%8E%AE":"1f3ae",
        "%F0%9F%8E%AF":"1f3af",
        "%F0%9F%8E%B0":"1f3b0",
        "%F0%9F%8E%B1":"1f3b1",
        "%F0%9F%8E%B2":"1f3b2",
        "%F0%9F%8E%B3":"1f3b3",
        "%F0%9F%8E%B4":"1f3b4",
        "%F0%9F%8E%B5":"1f3b5",
        "%F0%9F%8E%B6":"1f3b6",
        "%F0%9F%8E%B7":"1f3b7",
        "%F0%9F%8E%B8":"1f3b8",
        "%F0%9F%8E%B9":"1f3b9",
        "%F0%9F%8E%BA":"1f3ba",
        "%F0%9F%8E%BB":"1f3bb",
        "%F0%9F%8E%BC":"1f3bc",
        "%F0%9F%8E%BD":"1f3bd",
        "%F0%9F%8E%BE":"1f3be",
        "%F0%9F%8E%BF":"1f3bf",
        "%F0%9F%8F%80":"1f3c0",
        "%F0%9F%8F%81":"1f3c1",
        "%F0%9F%8F%82":"1f3c2",
        "%F0%9F%8F%83":"1f3c3",
        "%F0%9F%8F%84":"1f3c4",
        "%F0%9F%8F%86":"1f3c6",
        "%F0%9F%8F%88":"1f3c8",
        "%F0%9F%8F%8A":"1f3ca",
        "%F0%9F%8F%A0":"1f3e0",
        "%F0%9F%8F%A1":"1f3e1",
        "%F0%9F%8F%A2":"1f3e2",
        "%F0%9F%8F%A3":"1f3e3",
        "%F0%9F%8F%A5":"1f3e5",
        "%F0%9F%8F%A6":"1f3e6",
        "%F0%9F%8F%A7":"1f3e7",
        "%F0%9F%8F%A8":"1f3e8",
        "%F0%9F%8F%A9":"1f3e9",
        "%F0%9F%8F%AA":"1f3ea",
        "%F0%9F%8F%AB":"1f3eb",
        "%F0%9F%8F%AC":"1f3ec",
        "%F0%9F%8F%AD":"1f3ed",
        "%F0%9F%8F%AE":"1f3ee",
        "%F0%9F%8F%AF":"1f3ef",
        "%F0%9F%8F%B0":"1f3f0",
        "%F0%9F%90%8C":"1f40c",
        "%F0%9F%90%8D":"1f40d",
        "%F0%9F%90%8E":"1f40e",
        "%F0%9F%90%91":"1f411",
        "%F0%9F%90%92":"1f412",
        "%F0%9F%90%94":"1f414",
        "%F0%9F%90%97":"1f417",
        "%F0%9F%90%98":"1f418",
        "%F0%9F%90%99":"1f419",
        "%F0%9F%90%9A":"1f41a",
        "%F0%9F%90%9B":"1f41b",
        "%F0%9F%90%9C":"1f41c",
        "%F0%9F%90%9D":"1f41d",
        "%F0%9F%90%9E":"1f41e",
        "%F0%9F%90%9F":"1f41f",
        "%F0%9F%90%A0":"1f420",
        "%F0%9F%90%A1":"1f421",
        "%F0%9F%90%A2":"1f422",
        "%F0%9F%90%A3":"1f423",
        "%F0%9F%90%A4":"1f424",
        "%F0%9F%90%A5":"1f425",
        "%F0%9F%90%A6":"1f426",
        "%F0%9F%90%A7":"1f427",
        "%F0%9F%90%A8":"1f428",
        "%F0%9F%90%A9":"1f429",
        "%F0%9F%90%AB":"1f42b",
        "%F0%9F%90%AC":"1f42c",
        "%F0%9F%90%AD":"1f42d",
        "%F0%9F%90%AE":"1f42e",
        "%F0%9F%90%AF":"1f42f",
        "%F0%9F%90%B0":"1f430",
        "%F0%9F%90%B1":"1f431",
        "%F0%9F%90%B2":"1f432",
        "%F0%9F%90%B3":"1f433",
        "%F0%9F%90%B4":"1f434",
        "%F0%9F%90%B5":"1f435",
        "%F0%9F%90%B6":"1f436",
        "%F0%9F%90%B7":"1f437",
        "%F0%9F%90%B8":"1f438",
        "%F0%9F%90%B9":"1f439",
        "%F0%9F%90%BA":"1f43a",
        "%F0%9F%90%BB":"1f43b",
        "%F0%9F%90%BC":"1f43c",
        "%F0%9F%90%BD":"1f43d",
        "%F0%9F%90%BE":"1f43e",
        "%F0%9F%91%80":"1f440",
        "%F0%9F%91%82":"1f442",
        "%F0%9F%91%83":"1f443",
        "%F0%9F%91%84":"1f444",
        "%F0%9F%91%85":"1f445",
        "%F0%9F%91%86":"1f446",
        "%F0%9F%91%87":"1f447",
        "%F0%9F%91%88":"1f448",
        "%F0%9F%91%89":"1f449",
        "%F0%9F%91%8A":"1f44a",
        "%F0%9F%91%8B":"1f44b",
        "%F0%9F%91%8C":"1f44c",
        "%F0%9F%91%8D":"1f44d",
        "%F0%9F%91%8E":"1f44e",
        "%F0%9F%91%8F":"1f44f",
        "%F0%9F%91%90":"1f450",
        "%F0%9F%91%91":"1f451",
        "%F0%9F%91%92":"1f452",
        "%F0%9F%91%93":"1f453",
        "%F0%9F%91%94":"1f454",
        "%F0%9F%91%95":"1f455",
        "%F0%9F%91%96":"1f456",
        "%F0%9F%91%97":"1f457",
        "%F0%9F%91%98":"1f458",
        "%F0%9F%91%99":"1f459",
        "%F0%9F%91%9A":"1f45a",
        "%F0%9F%91%9B":"1f45b",
        "%F0%9F%91%9C":"1f45c",
        "%F0%9F%91%9D":"1f45d",
        "%F0%9F%91%9E":"1f45e",
        "%F0%9F%91%9F":"1f45f",
        "%F0%9F%91%A0":"1f460",
        "%F0%9F%91%A1":"1f461",
        "%F0%9F%91%A2":"1f462",
        "%F0%9F%91%A3":"1f463",
        "%F0%9F%91%A4":"1f464",
        "%F0%9F%91%A6":"1f466",
        "%F0%9F%91%A7":"1f467",
        "%F0%9F%91%A8":"1f468",
        "%F0%9F%91%A9":"1f469",
        "%F0%9F%91%AA":"1f46a",
        "%F0%9F%91%AB":"1f46b",
        "%F0%9F%91%AE":"1f46e",
        "%F0%9F%91%AF":"1f46f",
        "%F0%9F%91%B0":"1f470",
        "%F0%9F%91%B1":"1f471",
        "%F0%9F%91%B2":"1f472",
        "%F0%9F%91%B3":"1f473",
        "%F0%9F%91%B4":"1f474",
        "%F0%9F%91%B5":"1f475",
        "%F0%9F%91%B6":"1f476",
        "%F0%9F%91%B7":"1f477",
        "%F0%9F%91%B8":"1f478",
        "%F0%9F%91%B9":"1f479",
        "%F0%9F%91%BA":"1f47a",
        "%F0%9F%91%BB":"1f47b",
        "%F0%9F%91%BC":"1f47c",
        "%F0%9F%91%BD":"1f47d",
        "%F0%9F%91%BE":"1f47e",
        "%F0%9F%91%BF":"1f47f",
        "%F0%9F%92%80":"1f480",
        "%F0%9F%92%81":"1f481",
        "%F0%9F%92%82":"1f482",
        "%F0%9F%92%83":"1f483",
        "%F0%9F%92%84":"1f484",
        "%F0%9F%92%85":"1f485",
        "%F0%9F%92%86":"1f486",
        "%F0%9F%92%87":"1f487",
        "%F0%9F%92%88":"1f488",
        "%F0%9F%92%89":"1f489",
        "%F0%9F%92%8A":"1f48a",
        "%F0%9F%92%8B":"1f48b",
        "%F0%9F%92%8C":"1f48c",
        "%F0%9F%92%8D":"1f48d",
        "%F0%9F%92%8E":"1f48e",
        "%F0%9F%92%8F":"1f48f",
        "%F0%9F%92%90":"1f490",
        "%F0%9F%92%91":"1f491",
        "%F0%9F%92%92":"1f492",
        "%F0%9F%92%93":"1f493",
        "%F0%9F%92%94":"1f494",
        "%F0%9F%92%95":"1f495",
        "%F0%9F%92%96":"1f496",
        "%F0%9F%92%97":"1f497",
        "%F0%9F%92%98":"1f498",
        "%F0%9F%92%99":"1f499",
        "%F0%9F%92%9A":"1f49a",
        "%F0%9F%92%9B":"1f49b",
        "%F0%9F%92%9C":"1f49c",
        "%F0%9F%92%9D":"1f49d",
        "%F0%9F%92%9E":"1f49e",
        "%F0%9F%92%9F":"1f49f",
        "%F0%9F%92%A0":"1f4a0",
        "%F0%9F%92%A1":"1f4a1",
        "%F0%9F%92%A2":"1f4a2",
        "%F0%9F%92%A3":"1f4a3",
        "%F0%9F%92%A4":"1f4a4",
        "%F0%9F%92%A5":"1f4a5",
        "%F0%9F%92%A6":"1f4a6",
        "%F0%9F%92%A7":"1f4a7",
        "%F0%9F%92%A8":"1f4a8",
        "%F0%9F%92%A9":"1f4a9",
        "%F0%9F%92%AA":"1f4aa",
        "%F0%9F%92%AB":"1f4ab",
        "%F0%9F%92%AC":"1f4ac",
        "%F0%9F%92%AE":"1f4ae",
        "%F0%9F%92%AF":"1f4af",
        "%F0%9F%92%B0":"1f4b0",
        "%F0%9F%92%B1":"1f4b1",
        "%F0%9F%92%B2":"1f4b2",
        "%F0%9F%92%B3":"1f4b3",
        "%F0%9F%92%B4":"1f4b4",
        "%F0%9F%92%B5":"1f4b5",
        "%F0%9F%92%B8":"1f4b8",
        "%F0%9F%92%B9":"1f4b9",
        "%F0%9F%92%BA":"1f4ba",
        "%F0%9F%92%BB":"1f4bb",
        "%F0%9F%92%BC":"1f4bc",
        "%F0%9F%92%BD":"1f4bd",
        "%F0%9F%92%BE":"1f4be",
        "%F0%9F%92%BF":"1f4bf",
        "%F0%9F%93%80":"1f4c0",
        "%F0%9F%93%81":"1f4c1",
        "%F0%9F%93%82":"1f4c2",
        "%F0%9F%93%83":"1f4c3",
        "%F0%9F%93%84":"1f4c4",
        "%F0%9F%93%85":"1f4c5",
        "%F0%9F%93%86":"1f4c6",
        "%F0%9F%93%87":"1f4c7",
        "%F0%9F%93%88":"1f4c8",
        "%F0%9F%93%89":"1f4c9",
        "%F0%9F%93%8A":"1f4ca",
        "%F0%9F%93%8B":"1f4cb",
        "%F0%9F%93%8C":"1f4cc",
        "%F0%9F%93%8D":"1f4cd",
        "%F0%9F%93%8E":"1f4ce",
        "%F0%9F%93%8F":"1f4cf",
        "%F0%9F%93%90":"1f4d0",
        "%F0%9F%93%91":"1f4d1",
        "%F0%9F%93%92":"1f4d2",
        "%F0%9F%93%93":"1f4d3",
        "%F0%9F%93%94":"1f4d4",
        "%F0%9F%93%95":"1f4d5",
        "%F0%9F%93%96":"1f4d6",
        "%F0%9F%93%97":"1f4d7",
        "%F0%9F%93%98":"1f4d8",
        "%F0%9F%93%99":"1f4d9",
        "%F0%9F%93%9A":"1f4da",
        "%F0%9F%93%9B":"1f4db",
        "%F0%9F%93%9C":"1f4dc",
        "%F0%9F%93%9D":"1f4dd",
        "%F0%9F%93%9E":"1f4de",
        "%F0%9F%93%9F":"1f4df",
        "%F0%9F%93%A0":"1f4e0",
        "%F0%9F%93%A1":"1f4e1",
        "%F0%9F%93%A2":"1f4e2",
        "%F0%9F%93%A3":"1f4e3",
        "%F0%9F%93%A4":"1f4e4",
        "%F0%9F%93%A5":"1f4e5",
        "%F0%9F%93%A6":"1f4e6",
        "%F0%9F%93%A7":"1f4e7",
        "%F0%9F%93%A8":"1f4e8",
        "%F0%9F%93%A9":"1f4e9",
        "%F0%9F%93%AA":"1f4ea",
        "%F0%9F%93%AB":"1f4eb",
        "%F0%9F%93%AE":"1f4ee",
        "%F0%9F%93%B0":"1f4f0",
        "%F0%9F%93%B1":"1f4f1",
        "%F0%9F%93%B2":"1f4f2",
        "%F0%9F%93%B3":"1f4f3",
        "%F0%9F%93%B4":"1f4f4",
        "%F0%9F%93%B6":"1f4f6",
        "%F0%9F%93%B7":"1f4f7",
        "%F0%9F%93%B9":"1f4f9",
        "%F0%9F%93%BA":"1f4fa",
        "%F0%9F%93%BB":"1f4fb",
        "%F0%9F%93%BC":"1f4fc",
        "%F0%9F%94%83":"1f503",
        "%F0%9F%94%8A":"1f50a",
        "%F0%9F%94%8B":"1f50b",
        "%F0%9F%94%8C":"1f50c",
        "%F0%9F%94%8D":"1f50d",
        "%F0%9F%94%8E":"1f50e",
        "%F0%9F%94%8F":"1f50f",
        "%F0%9F%94%90":"1f510",
        "%F0%9F%94%91":"1f511",
        "%F0%9F%94%92":"1f512",
        "%F0%9F%94%93":"1f513",
        "%F0%9F%94%94":"1f514",
        "%F0%9F%94%96":"1f516",
        "%F0%9F%94%97":"1f517",
        "%F0%9F%94%98":"1f518",
        "%F0%9F%94%99":"1f519",
        "%F0%9F%94%9A":"1f51a",
        "%F0%9F%94%9B":"1f51b",
        "%F0%9F%94%9C":"1f51c",
        "%F0%9F%94%9D":"1f51d",
        "%F0%9F%94%9E":"1f51e",
        "%F0%9F%94%9F":"1f51f",
        "%F0%9F%94%A0":"1f520",
        "%F0%9F%94%A1":"1f521",
        "%F0%9F%94%A2":"1f522",
        "%F0%9F%94%A3":"1f523",
        "%F0%9F%94%A4":"1f524",
        "%F0%9F%94%A5":"1f525",
        "%F0%9F%94%A6":"1f526",
        "%F0%9F%94%A7":"1f527",
        "%F0%9F%94%A8":"1f528",
        "%F0%9F%94%A9":"1f529",
        "%F0%9F%94%AA":"1f52a",
        "%F0%9F%94%AB":"1f52b",
        "%F0%9F%94%AE":"1f52e",
        "%F0%9F%94%AF":"1f52f",
        "%F0%9F%94%B0":"1f530",
        "%F0%9F%94%B1":"1f531",
        "%F0%9F%94%B2":"1f532",
        "%F0%9F%94%B3":"1f533",
        "%F0%9F%94%B4":"1f534",
        "%F0%9F%94%B5":"1f535",
        "%F0%9F%94%B6":"1f536",
        "%F0%9F%94%B7":"1f537",
        "%F0%9F%94%B8":"1f538",
        "%F0%9F%94%B9":"1f539",
        "%F0%9F%94%BA":"1f53a",
        "%F0%9F%94%BB":"1f53b",
        "%F0%9F%94%BC":"1f53c",
        "%F0%9F%94%BD":"1f53d",
        "%F0%9F%95%90":"1f550",
        "%F0%9F%95%91":"1f551",
        "%F0%9F%95%92":"1f552",
        "%F0%9F%95%93":"1f553",
        "%F0%9F%95%94":"1f554",
        "%F0%9F%95%95":"1f555",
        "%F0%9F%95%96":"1f556",
        "%F0%9F%95%97":"1f557",
        "%F0%9F%95%98":"1f558",
        "%F0%9F%95%99":"1f559",
        "%F0%9F%95%9A":"1f55a",
        "%F0%9F%95%9B":"1f55b",
        "%F0%9F%97%BB":"1f5fb",
        "%F0%9F%97%BC":"1f5fc",
        "%F0%9F%97%BD":"1f5fd",
        "%F0%9F%97%BE":"1f5fe",
        "%F0%9F%97%BF":"1f5ff", //CRV Start of 6th Section
        "%F0%9F%98%80":"1f600",
        "%F0%9F%98%87":"1f607",
        "%F0%9F%98%88":"1f608",
        "%F0%9F%98%8E":"1f60e",
        "%F0%9F%98%90":"1f610",
        "%F0%9F%98%91":"1f611",
        "%F0%9F%98%95":"1f615",
        "%F0%9F%98%97":"1f617",
        "%F0%9F%98%99":"1f619",
        "%F0%9F%98%9B":"1f61b",
        "%F0%9F%98%9F":"1f61f",
        "%F0%9F%98%A6":"1f626",
        "%F0%9F%98%A7":"1f627",
        "%F0%9F%98%AC":"1f62c",
        "%F0%9F%98%AE":"1f62e",
        "%F0%9F%98%AF":"1f62f",
        "%F0%9F%98%B4":"1f634",
        "%F0%9F%98%B6":"1f636",  //CRV Start of 6b section
        "%F0%9F%9A%81":"1f681",
        "%F0%9F%9A%82":"1f682",
        "%F0%9F%9A%86":"1f686",
        "%F0%9F%9A%88":"1f688",
        "%F0%9F%9A%8A":"1f68a",
        "%F0%9F%9A%8D":"1f68d",
        "%F0%9F%9A%8E":"1f68e",
        "%F0%9F%9A%90":"1f690",
        "%F0%9F%9A%94":"1f694",
        "%F0%9F%9A%96":"1f696",
        "%F0%9F%9A%98":"1f698",
        "%F0%9F%9A%9B":"1f69b",
        "%F0%9F%9A%9C":"1f69c",
        "%F0%9F%9A%9D":"1f69d",
        "%F0%9F%9A%9E":"1f69e",
        "%F0%9F%9A%9F":"1f69f",
        "%F0%9F%9A%A0":"1f6a0",
        "%F0%9F%9A%A1":"1f6a1",
        "%F0%9F%9A%A3":"1f6a3",
        "%F0%9F%9A%A6":"1f6a6",
        "%F0%9F%9A%AE":"1f6ae",
        "%F0%9F%9A%AF":"1f6af",
        "%F0%9F%9A%B0":"1f6b0",
        "%F0%9F%9A%B1":"1f6b1",
        "%F0%9F%9A%B3":"1f6b3",
        "%F0%9F%9A%B4":"1f6b4",
        "%F0%9F%9A%B5":"1f6b5",
        "%F0%9F%9A%B7":"1f6b7",
        "%F0%9F%9A%B8":"1f6b8",
        "%F0%9F%9A%BF":"1f6bf",
        "%F0%9F%9B%81":"1f6c1",
        "%F0%9F%9B%82":"1f6c2",
        "%F0%9F%9B%83":"1f6c3",
        "%F0%9F%9B%84":"1f6c4",
        "%F0%9F%9B%85":"1f6c5", //CRV start of 7th section
        "%F0%9F%8C%8D":"1f30d",
        "%F0%9F%8C%8E":"1f30e",
        "%F0%9F%8C%90":"1f310",
        "%F0%9F%8C%92":"1f312",
        "%F0%9F%8C%96":"1f316",
        "%F0%9F%8C%97":"1f317",
        "%F0%9F%8C%98":"1f318",
        "%F0%9F%8C%9A":"1f31a",
        "%F0%9F%8C%9C":"1f31c",
        "%F0%9F%8C%9D":"1f31d",
        "%F0%9F%8C%9E":"1f31e",
        "%F0%9F%8C%B2":"1f332",
        "%F0%9F%8C%B3":"1f333",
        "%F0%9F%8D%8B":"1f34b",
        "%F0%9F%8D%90":"1f350",
        "%F0%9F%8D%BC":"1f37c",
        "%F0%9F%8F%87":"1f3c7",
        "%F0%9F%8F%89":"1f3c9",
        "%F0%9F%8F%A4":"1f3e4",
        "%F0%9F%90%80":"1f400",
        "%F0%9F%90%81":"1f401",
        "%F0%9F%90%82":"1f402",
        "%F0%9F%90%83":"1f403",
        "%F0%9F%90%84":"1f404",
        "%F0%9F%90%85":"1f405",
        "%F0%9F%90%86":"1f406",
        "%F0%9F%90%87":"1f407",
        "%F0%9F%90%88":"1f408",
        "%F0%9F%90%89":"1f409",
        "%F0%9F%90%8A":"1f40a",
        "%F0%9F%90%8B":"1f40b",
        "%F0%9F%90%8F":"1f40f",
        "%F0%9F%90%90":"1f410",
        "%F0%9F%90%93":"1f413",
        "%F0%9F%90%95":"1f415",
        "%F0%9F%90%96":"1f416",
        "%F0%9F%90%AA":"1f42a",
        "%F0%9F%91%A5":"1f465",
        "%F0%9F%91%AC":"1f46c",
        "%F0%9F%91%AD":"1f46d",
        "%F0%9F%92%AD":"1f4ad",
        "%F0%9F%92%B6":"1f4b6",
        "%F0%9F%92%B7":"1f4b7",
        "%F0%9F%93%AC":"1f4ec",
        "%F0%9F%93%AD":"1f4ed",
        "%F0%9F%93%AF":"1f4ef",
        "%F0%9F%93%B5":"1f4f5",
        "%F0%9F%94%80":"1f500",
        "%F0%9F%94%81":"1f501",
        "%F0%9F%94%82":"1f502",
        "%F0%9F%94%84":"1f504",
        "%F0%9F%94%85":"1f505",
        "%F0%9F%94%86":"1f506",
        "%F0%9F%94%87":"1f507",
        "%F0%9F%94%89":"1f509",
        "%F0%9F%94%95":"1f515",
        "%F0%9F%94%AC":"1f52c",
        "%F0%9F%94%AD":"1f52d",
        "%F0%9F%95%9C":"1f55c",
        "%F0%9F%95%9D":"1f55d",
        "%F0%9F%95%9E":"1f55e",
        "%F0%9F%95%9F":"1f55f",
        "%F0%9F%95%A0":"1f560",
        "%F0%9F%95%A1":"1f561",
        "%F0%9F%95%A2":"1f562",
        "%F0%9F%95%A3":"1f563",
        "%F0%9F%95%A4":"1f564",
        "%F0%9F%95%A5":"1f565",
        "%F0%9F%95%A6":"1f566",
        "%F0%9F%95%A7":"1f567",
        "%F0%9F%91%AE":"1f46e" //CRV TEMPORARILY ADDED NEED TO REMOVE IS DUPLICATE OF ABOVE
    };

    $.each(emoji, function(index, key){
        //KL REMOVED onclick="addThisEmoticon(this)" FROM THESE HTML ELEMENTS BEING INSERTED VIA CONTENT SCRIPTS, BECAUSE INLINE JAVASCRIPT IS NOT ALLOWED
        html += '<div class="emojiHolder" ><img class="emoji gtextEmoji eeselectoritem spriteEMOJI sprite-' + key + '" data-textvalue="' + index + '" src="' + imgPlaceHolderURL + '"></div>';
    });
    return(html);

}
var lazyImage = "assets/grey.gif";

function buildQuotesHTML() {
    var quotes = [
    	"\"Whatever the mind of man can conceive and believe, it can achieve.\" -  Napoleon Hill",
        "\"Your time is limited, so don't waste it living someone else's life.\" - Steve Jobs",
        "\"Strive not to be a success, but rather to be of value.\" - Albert Einstein",
        "\"Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.\" - Robert Frost",
        "\"The common question that gets asked in business is, 'why?' That's a good question, but an equally valid question is, \â€˜why not?\'\" - Jeffrey Bezos",
        "\"You miss 100% of the shots you don't take.\" - Wayne Gretzky",
        "\"I've missed more than 9000 shots in my career. I've lost almost 300 games. 26 times I've been trusted to take the game winning shot and missed. I've failed over and over and over again in my life. And that is why I succeed.\" - Michael Jordan",
        "\"Every strike brings me closer to the next home run.\" - Babe Ruth",
        "\"Definiteness of purpose is the starting point of all achievement.\" - W. Clement Stone",
        "\"Life is what happens to you while you're busy making other plans.\" - John Lennon",
        "\"We become what we think about.\" - Earl Nightingale",
        "\"Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do, so throw off the bowlines, sail away from safe harbor, catch the trade winds in your sails.  Explore, Dream, Discover.\" - Mark Twain",
        "\"Life is 10% what happens to me and 90% of how I react to it.\" - John Maxwell",
        "\"If you do what you've always done, you'll get what you've always gotten.\" - Tony Robbins",
        "\"The mind is everything. What you think you become.\" - Buddha",
        "\"The best time to plant a tree was 20 years ago. The second best time is now.\" - Chinese Proverb",
        "\"An unexamined life is not worth living.\" - Socrates",
        "\"Eighty percent of success is showing up.\" - Woody Allen",
        "\"Don't wait. The time will never be just right.\" - Napoleon Hill",
        "\"Winning isn't everything, but wanting to win is.\" - Vince Lombardi",
        "\"I am not a product of my circumstances. I am a product of my decisions.\" - Stephen Covey",
        "\"Every child is an artist.  The problem is how to remain an artist once he grows up.\" - Pablo Picasso",
        "\"You can never cross the ocean until you have the courage to lose sight of the shore.\" - Christopher Columbus",
        "\"I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.\" - Maya Angelou",
        "\"Either you run the day, or the day runs you.\" - Jim Rohn",
        "\"Whether you think you can or you think you can't, you're right.\" - Henry Ford",
        "\"The two most important days in your life are the day you are born and the day you find out why.\" - Mark Twain",
        "\"Whatever you can do, or dream you can, begin it.  Boldness has genius, power and magic in it.\" - Johann Wolfgang von Goethe",
        "\"The best revenge is massive success.\" - Frank Sinatra",
        "\"People often say that motivation doesn't last. Well, neither does bathing. That's why we recommend it daily.\" - Zig Ziglar",
        "\"Inspiration exists, but it must find you working.\" - Pablo Picasso",
        "\"If you hear a voice within you say 'you cannot paint,â€ then by all means paint and that voice will be silenced.\" - Vincent Van Gogh",
        "\"There is only one way to avoid criticism: do nothing, say nothing, and be nothing.\" - Aristotle",
        "\"Obstacles are those frightful things you see when you take your eyes off the goal.\" - Henry Ford",
        "\"The only person you are destined to become is the person you decide to be.\" - Ralph Waldo Emerson",
        "\"Go confidently in the direction of your dreams.  Live the life you have imagined.\" - Henry David Thoreau",
        "\"When I stand before God at the end of my life, I would hope that I would not have a single bit of talent left and could say, I used everything you gave me.\" - Erma Bombeck",
        "\"Successful people are always looking for opportunities to help others.  Unsuccessful people are always asking, 'What's in it for me?â€\" - Brian Tracy",
        "\"Certain things catch your eye, but pursue only those that capture the heart. \" - Ancient Indian Proverb",
        "\"Believe you can and you're halfway there.\" - Theodore Roosevelt",
        "\"Everything you've ever wanted is on the other side of fear.\" - George Addair",
        "\"We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.\" - Plato",
        "\"Once you choose hope, anything's possible.\" - Christopher Reeve",
        "\"Start where you are. Use what you have.  Do what you can.\" - Arthur Ashe",
        "\"When I was 5 years old, my mother always told me that happiness was the key to life.  When I went to school, they asked me what I wanted to be when I grew up.  I wrote down â€˜happy'.  They told me I didn't understand the assignment, and I told them they didn't understand life.\" - John Lennon",
        "\"Fall seven times and stand up eight.\" - Japanese Proverb",
        "\"When one door of happiness closes, another opens, but often we look so long at the closed door that we do not see the one that has been opened for us.\" - Helen Keller",
        "\"Everything has beauty, but not everyone can see.\" - Confucious",
        "\"How wonderful it is that nobody need wait a single moment before starting to improve the world.\" - Anne Frank",
        "\"When I let go of what I am, I become what I might be.\" - Lao Tzu",
        "\"The difference between a successful person and others is not lack of strength not a lack of knowledge but rather a lack of will.\" - Vince Lombardi",
        "\"Happiness is not something readymade.  It comes from your own actions.\" - Dalai Lama",
        "\"The only way of finding the limits of the possible is by going beyond them into the impossible.\" - Arthur C. Clarke",
        "\"First, have a definite, clear practical ideal; a goal, an objective. Second, have the necessary means to achieve your ends; wisdom, money, materials, and methods. Third, adjust all your means to that end. \" - Aristotle",
        "\"If the wind will not serve, take to the oars.\" - Latin Proverb",
        "\"You can't fall if you don't climb.  But there's no joy in living your whole life on the ground.\" - Unknown",
        "\"Whoever loves much, performs much, and can accomplish much, and what is done in love is done well.\" - Vincent Van Gogh",
        "\"Too many of us are not living our dreams because we were living our fears.\" - Les Brown",
        "\"Challenges are what make life interesting and overcoming them is what makes life meaningful.\" - Joshua J. Marine",
        "\"The way to get started is to quit talking and begin doing.\" - Walt Disney",
        "\"I have been impressed with the urgency of doing. Knowing is not enough; we must apply. Being willing is not enough; we must do.\" - Leonardo da Vinci",
        "\"Limitations live only in our minds.  But if we use our imaginations, our possibilities become limitless.\" - Jamie Paolinetti",
        "\"Expose yourself to your deepest fear; after that, fear has no power, and the fear of freedom shrinks and vanishes.  You are free.\" - Jim Morrison",
        "\"What's money? A man is a success if he gets up in the morning and goes to bed at night and in between does what he wants to do.\" - Bob Dylan",
        "\"I didn't fail the test. I just found 100 ways to do it wrong.\" - Benjamin Franklin",
        "\"In order to succeed, your desire for success should be greater than your fear of failure.\" - Bill Cosby",
        "\"A person who never made a mistake never tried anything new.\" - Albert Einstein",
        "\"The person who says it cannot be done should not interrupt the person who is doing it.\" - Chinese Proverb",
        "\"There are no traffic jams along the extra mile.\" - Roger Staubach",
        "\"It is never too late to be what you might have been.\" - George Eliot",
        "\"You become what you believe.\" - Oprah Winfrey",
        "\"I would rather die of passion than of boredom.\" - Vincent van Gogh",
        "\"A truly rich man is one whose children run into his arms when his hands are empty.\" - Unknown",
        "\"It is not what you do for your children, but what you have taught them to do for themselves, that will make them successful human beings. \" - Ann Landers",
        "\"If you want your children to turn out well, spend twice as much time with them, and half as much money.\" - Abigail Van Buren",
        "\"Build your own dreams, or someone else will hire you to build theirs.\" - Farrah Gray",
        "\"Without deviation from the norm, progress is not possible.\" - Frank Zappa",
        "\"Education costs money.  But then so does ignorance.\" - Sir Claus Moser",
        "\"Remember that the happiest people are not those getting more, but those giving more.\" - H. Jackson Brown, Jr.",
        "\"It does not matter how slowly you go as long as you do not stop.\" - Confucius",
        "\"Let the refining and improving of your own life keep you so busy that you have little time to criticize others.\" - H. Jackson Brown, Jr.",
        "\"Remember that not getting what you want is sometimes a wonderful stroke of luck.\" - Dalai Lama",
        "\"You can't use up creativity.  The more you use, the more you have.\" - Maya Angelou",
        "\"Dream big and dare to fail.\" - Norman Vaughan",
        "\"Our lives begin to end the day we become silent about things that matter.\" - Martin Luther King Jr.",
        "\"Do what you can, where you are, with what you have.\" - Teddy Roosevelt",
        "\"The most common way people give up their power is by thinking they don't have any.\" - Alice Walker",
        "\"Dreaming, after all, is a form of planning.\" - Gloria Steinem",
        "\"It's your place in the world; it's your life. Go on and do all you can with it, and make it the life you want to live.\" - Mae Jemison",
        "\"You may be disappointed if you fail, but you are doomed if you don't try.\" - Beverly Sills",
        "\"Remember no one can make you feel inferior without your consent.\" - Eleanor Roosevelt",
        "\"Life is what we make it, always has been, always will be.\" - Grandma Moses",
        "\"The question isn't who is going to let me; it's who is going to stop me.\" - Ayn Rand",
        "\"When everything seems to be going against you, remember that the airplane takes off against the wind, not with it.\" - Henry Ford",
        "\"It's not the years in your life that count. It's the life in your years.\" - Abraham Lincoln",
        "\"Change your thoughts and you change your world.\" - Norman Vincent Peale",
        "\"Either write something worth reading or do something worth writing.\" - Benjamin Franklin",
        "\"Nothing is impossible, the word itself says, 'I'm possible'\" - Audrey Hepburn",
        "\"The only way to do great work is to love what you do.\" - Steve Jobs",
        "\"If you can dream it, you can achieve it.\" - Zig Ziglar",
        "\"If you were born poor it's not your mistake, but if you die poor it is your mistake\" - Bill Gates",
        "\"If you want happy ending it depends on where you stop the story\" - ",
        "\"If you want to go far go together, if you\""
    ];


    var html = '';
    html += '<table class="table"><thead><tr><th>Quote</th><th></th></tr></thead><tbody>';
    for(var i = 0; i < quotes.length; i++) {
        html += '<tr><td>' + quotes[i] + '</td><td><button class="btn btn-success" onclick="addQuoteToMessage(this);">Add</button></td></tr>';
    }
    html += '</tbody></table>';

    return(html);
}

function addQuoteToMessage(element) {
    console.log(element);
    var quote = $(element).parent().siblings().text();

    var responseArea = $(element).parent().parent().parent().parent().parent().parent().parent().siblings('#EEModalFooter').children('.responseArea').children('.textResponse');

    $(responseArea).append(quote);

//OLD	var elem = $('#EEModalFooter').children('.responseArea').children('.textResponse').get(0);//This is the element that you want to move the caret to the end of
    var elem = $('#EEModalFooter').children('.responseArea').children('.messageContainer').children('.messageToSend');//This is the element that you want to move the caret to the end of

    setEndOfContenteditable(elem);
}
	
	