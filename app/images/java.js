function cookie_get(nm){
	var r='',dc=document.cookie;
	if(dc){
		var c=dc.split('; ');
		for(var i=0; i<c.length; i++){
			var k=c[i].split('=');
			if(k[0]==nm && k[1]!=''){
				r=k[1].split("+");
				break;
			}
		}

		for(i=0; i<r.length; i++)
			r[i]=decodeURIComponent(r[i]);
	}

	return(r);
}

function welcome(lg){
	var nm=cookie_get('user'),wl=[['ようこそ','Welcome'],[' さん','']];

	if(nm[6].length>1)
		document.getElementById('welcome').innerHTML=wl[0][lg]+' <B>'+decodeURIComponent(nm[6]).substr(1)+'<\/B>'+wl[1][lg];
}

function facebook(u,t){
	u=encodeURIComponent('http:\/\/dan-ball.jp'+u);
	t=encodeURIComponent(t);
	var s='DISPLAY:inline-block;WIDTH:55px;HEIGHT:20px;MARGIN:0 0 0 2px;BACKGROUND:url(/images/plus2.png);';
	var d='<A HREF="http:\/\/www.facebook.com\/plugins\/like.php?href='+u+'" REL="nofollow noopener" TARGET="_blank" STYLE="'+s+'BACKGROUND-POSITION:center -66px" TITLE="facebook like"><\/A>';
	d+='<A HREF="https:\/\/www.facebook.com\/sharer\/sharer.php?u='+u+'" REL="nofollow noopener" TARGET="_blank" STYLE="'+s+'BACKGROUND-POSITION:center -44px" TITLE="facebook sharer"><\/A>';
	d+='<A HREF="https:\/\/twitter.com\/intent\/tweet?original_referer='+u+'&text='+t+'&tw_p=tweetbutton&url='+u+'" REL="nofollow noopener" TARGET="_blank" STYLE="'+s+'BACKGROUND-POSITION:center -22px" TITLE="twitter"><\/A>';
	d+='<DIV STYLE="DISPLAY:inline-block;WIDTH:32px;HEIGHT:20px;MARGIN:0 0 0 2px;"><g:plusone size="medium" annotation="none"><\/g:plusone><\/DIV>';
	document.getElementById('facebook').innerHTML=d;

	(function(){var po=document.createElement('script');po.type='text\/javascript';po.async=true;po.src='https:\/\/apis.google.com\/js\/plusone.js';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(po,s);})();
}

var ajax_a=new Array();
var ajax_f=new Array();
function ajax(u,c){
	ajax_f[u]=c;

	try{
		ajax_a[u]=new ActiveXObject('Msxml2.XMLHTTP');
	}catch(e){
		try{
			ajax_a[u]=new ActiveXObject('Microsoft.XMLHTTP');
		}catch(e){
			if(typeof XMLHttpRequest!='undefined')	ajax_a[u]=new XMLHttpRequest();
			else									return;
		}
	}
	if(c!=''){
		ajax_a[u].onreadystatechange=function(){
			if(ajax_a[u].readyState==4 && ajax_a[u].status==200)
				setTimeout(ajax_f[u]+'(\''+ajax_a[u].responseText+'\')',0);
		}
	}
	ajax_a[u].open('POST','\/'+u,true);
	ajax_a[u].send(new Date().getTime());
}

function counter(a){
	if(''==a.match(/^[0-9,]+$/))
		return;

	var w,m=0,i,h;

	a=a.split(',');
	for(i=0;i<9;i++)
		a[i]=a[i]*1;
	for(i=0;i<8;i++)
		if(m<a[i])	m=a[i];

	var t=a[9]%7;
	var sun=(t+3)%7,sat=(t+2)%7;

	w='<DIV STYLE="CLEAR:both;WIDTH:100%;HEIGHT:50px;OVERFLOW:hidden;BORDER-BOTTOM:1px solid #600"><DIV STYLE="WIDTH:100%;">';
		for(i=0;i<8;i++){
			h=50-(50*a[i]/m);
			w+='<DIV STYLE="FLOAT:left;HEIGHT:50px;WIDTH:12.5%;TEXT-ALIGN:center;">';
				w+='<DIV STYLE="DISPLAY:inline-block;WIDTH:50%;HEIGHT:50px;MARGIN:'+h+'px 0 0;BACKGROUND:'+(i==7?'#a84416':'#d72')+'"><\/DIV>';
			w+='<\/DIV>';
		}
	w+='<\/DIV><\/DIV>';
	w+='<DIV STYLE="WIDTH:100%;MARGIN-TOP:1px;">';
		for(i=0;i<8;i++){
			w+='<FONT COLOR="#';
				if(sun==i%7)		w+='FF0000';
				else if(sat==i%7)	w+='0000FF';
				else				w+='000000';
			w+='" STYLE="DISPLAY:block;FLOAT:left;WIDTH:12.5%;TEXT-ALIGN:center">';
				if(a[i]<100000)				w+=a[i];
				else if(a[i]<10000000)		w+=Math.floor(a[i]/1000)+'k';
				else if(a[i]<100000000)		w+=(Math.floor(a[i]/100000)/10).toFixed(1)+'m';
				else if(a[i]<10000000000)	w+=Math.floor(a[i]/1000000)+'m';
				else						w+='9999m';
			w+='<\/FONT>';

		}
	w+='<\/DIV>';
	w+='<B STYLE="CLEAR:both;DISPLAY:block;LINE-HEIGHT:14px;FONT-SIZE:12px;LETTER-SPACING:5px">'+a[8]+'<\/B>';

	document.getElementById('counter_graph').innerHTML=w;
}

function applet_s(id,id2,di,ver,w,h){
	return('<DIV CLASS="gmw"><APPLET ID="'+id+'" CODE="'+id+'.class" ARCHIVE="'+di+id2+'\/'+ver+'\/'+id+'.jar" WIDTH="'+w+'" HEIGHT="'+h+'">');
}

function applet_p(nm,vl){
	return('<PARAM NAME="'+nm+'" VALUE="'+vl+'">');
}

function applet_e(d){
	return('<HR>'+d+'<HR><\/APPLET><\/DIV>');
}

function dust_4works(a){
	if(null!=a.match(/</))
		return;

	var w='',i,v=[['票','vote'],['作品を見る','play'],['\/','\/en\/']];
	a=a.split('>');

	for(i=0;i<7*4;i+=7){
		if(a[(i+1)]=='')
			break;
		w+='<DIV CLASS="box save_div">';
			w+=(a[(i+5)]?'<BR>':'<SPAN>new<\/SPAN>');
			if(a[29]==1)	w+='<IMG SRC="\/images\/dust\/'+(Math.floor(a[(i+1)]/1000)*1000)+'\/'+a[(i+1)]+'.gif" ALT="'+a[(i+1)]+'" WIDTH="100" HEIGHT="75" CLASS="save_img">';
			else			w+='<IMG SRC="\/images\/dust2\/'+Math.floor(a[(i+1)]/1000)+'\/'+a[(i+1)]+'.png" ALT="'+a[(i+1)]+'" WIDTH="124" HEIGHT="70" CLASS="save_img">';
			w+=a[(i+2)]+'<BR>';
			w+='by '+a[(i+0)]+'<BR>';
			w+='<DIV CLASS="star">';
				if(a[(i+3)]<10)			w+='<DIV CLASS="star_c0" STYLE="LEFT:'+(Math.round((a[(i+3)]- 0)*6.11)-55)+'px;"><\/DIV>';
				else if(a[(i+3)]<50)	w+='<DIV CLASS="star_c1" STYLE="LEFT:'+(Math.round((a[(i+3)]- 9)*1.37)-55)+'px;"><\/DIV>';
				else if(a[(i+3)]<100)	w+='<DIV CLASS="star_c2" STYLE="LEFT:'+(Math.round((a[(i+3)]-49)*1.12)-55)+'px;"><\/DIV>';
				else if(a[(i+3)]<500)	w+='<DIV CLASS="star_c3" STYLE="LEFT:'+(Math.round((a[(i+3)]-99)*0.12)-55)+'px;"><\/DIV>';
				else					w+='<DIV CLASS="star_c4"><\/DIV>';
				w+='<SPAN CLASS="star_span"><\/SPAN>';
			w+='<\/DIV>';
			w+=a[(i+3)]+v[0][a[28]]+'<BR>';
			w+=a[(i+4)]+'<BR>';
			a[(i+2)]=a[(i+2)].replace('\\\\','').replace('&#039;','').replace('&quot;','').replace('&gt;','').replace('&lt;','');
			a[(i+0)]=a[(i+0)].replace('\\\\','').replace('&#039;','').replace('&quot;','').replace('&gt;','').replace('&lt;','');
			if(-1==location.pathname.indexOf('\/ja\/'))
				w+='<A HREF="'+v[2][a[28]]+'javagame\/dust'+(a[29]==1?'':'2')+'\/'+a[(i+1)]+'.html">'+v[1][a[28]]+'<\/A>';
			else
				w+='<A HREF="'+v[2][a[28]]+'javagame\/dust'+(a[29]==1?'':'2')+'\/ja\/'+a[(i+1)]+'.html">'+v[1][a[28]]+'<\/A>';
		w+='<\/DIV>';
	}

	document.getElementById('save').innerHTML=w;
}
function dust_4works2_html5(a){
	if(null!=a.match(/</))
		return;

	var w='',i,v=[['票','vote'],['\/','\/en\/']];
	a=a.split('>');

	for(i=0;i<7*4;i+=7){
		if(a[(i+1)]=='')
			break;
		w+='<DIV CLASS="box save_div">';
			w+=(a[(i+5)]?'':'<SPAN>new<\/SPAN>');
			w+='<BR><A HREF="'+v[1][a[28]]+'javagame\/dust'+(a[29]==1?'':'2')+'\/';
			w+=(-1!=location.pathname.indexOf('\/ja\/')?'ja\/':'')+a[(i+1)]+'.html">';
			if(a[29]==1)	w+='<IMG SRC="\/images\/dust\/'+(Math.floor(a[(i+1)]/1000)*1000)+'\/'+a[(i+1)]+'.gif" WIDTH="100" HEIGHT="75" CLASS="save_img">';
			else			w+='<IMG SRC="\/images\/dust2\/'+Math.floor(a[(i+1)]/1000)+'\/'+a[(i+1)]+'.png" WIDTH="124" HEIGHT="70" CLASS="save_img">';
			w+='<BR>'+a[(i+2)]+'<\/A><BR>';
			w+='<DIV CLASS="star">';
				if(a[(i+3)]<10)			w+='<DIV CLASS="star_c0" STYLE="LEFT:'+(Math.round((a[(i+3)]- 0)*6.11)-55)+'px;"><\/DIV>';
				else if(a[(i+3)]<50)	w+='<DIV CLASS="star_c1" STYLE="LEFT:'+(Math.round((a[(i+3)]- 9)*1.37)-55)+'px;"><\/DIV>';
				else if(a[(i+3)]<100)	w+='<DIV CLASS="star_c2" STYLE="LEFT:'+(Math.round((a[(i+3)]-49)*1.12)-55)+'px;"><\/DIV>';
				else if(a[(i+3)]<500)	w+='<DIV CLASS="star_c3" STYLE="LEFT:'+(Math.round((a[(i+3)]-99)*0.12)-55)+'px;"><\/DIV>';
				else					w+='<DIV CLASS="star_c4"><\/DIV>';
				w+='<SPAN CLASS="star_span"><\/SPAN>';
			w+='<\/DIV>';
			w+=('     '+a[(i+3)]).substr(-6)+v[0][a[28]]+'<BR>';
			w+='by '+a[(i+0)]+'<BR>';
			w+=a[(i+4)];
		w+='<\/DIV>';
	}
	document.getElementById('save').innerHTML=w;
}
function vote(cmt,nm,pt,vc,tm,lg,gd,fg,no){
	var v='';

	if(no==1)		ajax('javagame\/dust\/vote.php?vote='+fg+'&code='+gd,'');
	else if(no==2)	ajax('javagame\/dust2\/vote.php?vote='+fg+'&code='+gd,'');

	if(fg==0)	pt++;

	v+=more_write(cmt,nm,pt,tm,lg);
	v+='<FONT COLOR="#FF0000">';
	if(fg==0)	v+=(lg=='0'?'※投票ありがとう御座います。':'* Thank you for voting.');
	else		v+=(lg=='0'?'※削除依頼されました。':'* Your deletion request is sent.');
	v+='<\/FONT><BR><BR>';

	document.getElementById('d_vote').innerHTML=v;
}

function more_write(cmt,nm,pt,tm,lg){
	var v='<STRONG>- ｢'+cmt+'｣ -<\/STRONG><BR>';
	v+='<DIV ALIGN="CENTER" STYLE="WHITE-SPACE:pre;"><DIV CLASS="star" STYLE="DISPLAY:inline-block;">';
		 if(pt<10)	v+='<DIV CLASS="c0" STYLE="LEFT:'+(((pt-0)*6.11)-55)+'px"></DIV>';
	else if(pt<50)	v+='<DIV CLASS="c1" STYLE="LEFT:'+(((pt-9)*1.375)-55)+'px"></DIV>';
	else if(pt<100)	v+='<DIV CLASS="c2" STYLE="LEFT:'+(((pt-49)*1.122)-55)+'px"></DIV>';
	else if(pt<500)	v+='<DIV CLASS="c3" STYLE="LEFT:'+(((pt-99)*0.137)-55)+'px"></DIV>';
	else			v+='<DIV CLASS="c4"><\/DIV>';
	v+='<SPAN><\/SPAN><\/DIV>'+('     '+pt).substr(-6)+(lg=='0'?'票':'votes');
	v+='<BR>by '+nm+'<BR>'+tm+'<\/DIV>';

	return v;
}

function hrc(r){
	var r=r.innerHTML.replace('&amp;','&');
	r=r.replace('&quot;','"');
	r=r.replace('&#039;',"'");
	r=r.replace('&lt;'	,'<');
	r=r.replace('&gt;'	,'>');
	return r;
}

function hu_tag(id,lg){
	var w='',ck=cookie_get('user');
	var v=[['復活の呪文','Save game'],['ゲット','Get'],['セット','Set'],['ユーザー登録が必要です。','User registration is required.']];

	if(ck[3]!=''){
		w+='<TABLE ID="htbl"><TR><TH>'+v[0][lg]+'<\/TH><TD><TEXTAREA ID="bun" ONCLICK="this.select();"><\/TEXTAREA><\/TD><TH>';
			w+='<INPUT TYPE="SUBMIT" VALUE="'+v[1][lg]+'" ONCLICK="save(\''+id+'\')" ONMOUSEDOWN="';
				w+='document.getElementById(\'bun\').value=\'\';document.getElementById(\'pass\').innerHTML=\'　\';';
			w+='">';
			w+='<INPUT TYPE="SUBMIT" VALUE="'+v[2][lg]+'" ONCLICK="load(\''+id+'\')" ONMOUSEDOWN="';
				w+='document.getElementById(\'pass\').innerHTML=\'　\';';
			w+='">';
		w+='<\/TH><\/TR><\/TABLE><DIV id="pass" STYLE="HEIGHT:14px;"><\/DIV><BR>';
	}else{
		w+='<TABLE CLASS="ctbl" STYLE="MARGIN:0 auto;"><TR><TH><B>'+v[0][lg]+'<\/B><\/TH><TD>'+v[3][lg]+'<\/TD><\/TR><\/TABLE>';
		w+='<BR>';
	}

	document.getElementById('hu_tag').innerHTML=w;
}

function save(id){
	var s='',h='Error';

	if(document.getElementById('gmi'))	s=document.getElementById('gmi').contentWindow.GameSave('0');
	else								s=document.getElementById(id).a('0');
	if(s!=''){
		document.getElementById('bun').value=s;
		h='Get OK';
	}

	document.getElementById('pass').innerHTML=h;
}

function load(id){
	document.getElementById('bun').value=document.getElementById('bun').value.replace(/\x0D\x0A|\x0D|\x0A/g,'');
	var s=document.getElementById('bun').value,ret=-1,h='Error';
	if(s!=''){
		if(document.getElementById('gmi'))	ret=document.getElementById('gmi').contentWindow.GameLoad(s);
		else								ret=document.getElementById(id).b(s);
	}
	if(ret!=-1)	h='Set OK';

	document.getElementById('pass').innerHTML=h;
}

function timer(id,u,t){
	try{
		var s='';
		if(document.getElementById('gmi'))	s=document.getElementById('gmi').contentWindow.AutoSave('0');
		else								s=document.getElementById(id).c('0');
		if(s!=''){
			var time=new Date(new Date().setTime(0)).toGMTString();
			document.cookie='save='+s+'; expires='+time+'; path='+u+'\/ja; ';
			document.cookie='save='+s+'; expires='+time+'; path='+u+'\/ja\/; ';
			document.cookie='save='+s+'; expires='+time+'; path='+u.substr(0,-1)+'; ';
			time=new Date(new Date().getTime()+(1000*3600*24*30*3)).toGMTString();
			document.cookie='save='+s+'; expires='+time+'; path='+u+'; ';
		}
	}catch(e){
	}

	setTimeout("timer('"+id+"','"+u+"',"+t+")",t);
}

function logi_i(n,w,h,d){
	var e='',i=0,j=0;
	for(i=0; i<h; i++){
		for(j=0; j<w; j++){
			e+='<DIV STYLE="DISPLAY:inline-block;WIDTH:1px;HEIGHT:1px;BACKGROUND:#';
			e+=('0'==d.substr((i*w+j),1)?'fff6d4':'111111');
			e+=';"><\/DIV>';
		}
	}
	document.getElementById('logi_i'+n).innerHTML='<DIV STYLE="DISPLAY:inline-block;WIDTH:'+w+'px;HEIGHT:'+h+'px;WHITE-SPACE:normal;MARGIN:0 auto;">'+e+'<\/DIV>';
}

function post(u_no,v_no,v){
	var i,f=document.createElement('form');
	document.body.appendChild(f);
	for(var k in post_v[v_no])
		v[k]=post_v[v_no][k];
	for(var k in v){
		i=document.createElement('input');
		i.setAttribute('type','hidden');
		i.setAttribute('name',k);
		i.setAttribute('value',v[k]);
		f.appendChild(i);
	}
	f.setAttribute('action',post_u[u_no]);
	f.setAttribute('method','post');
	f.submit();
}

function top_blank(){
	var l=document.links,c=document.links.length;
	for(var i=0; i<c; i++)
		if(l[i].target!='dframe' && l[i].target!='_blank')	l[i].target='_top';

	try{
		var p=parent.location.href;
	}catch(e){
	}
	var m=location.href;
	if(p!=m){
		var w=0,h=0;
		if(window.innerWidth){
			w=window.innerWidth;
			h=window.innerHeight;
		}else if(document.documentElement && document.documentElement.clientWidth!=0){
			w=document.documentElement.clientWidth;
			h=document.documentElement.clientHeight;
		}else if(document.body){
			w=document.body.clientWidth;
			h=document.body.clientHeight;
		}
		if(w<800)
			parent.location.href=m;
		if((w==996 && h==896) || (w==1000 && h==900))
			parent.location.href=m;
	}
}