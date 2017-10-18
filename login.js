
mui.plusReady(function(){
	/************************** 测试方法 *******************/
	var params = plus.webview.currentWebview();
	// 锁定屏幕方向
	plus.screen.lockOrientation('portrait');
    if(params.needClose){
//  		console.log("================");
        closeAllWindowNotSelf();
    }
    
    function closeAllWindowNotSelf(){
    		setTimeout(function () {
					var wvs = plus.webview.all();
					var page = plus.webview.currentWebview();
					for (var i = 0; i < wvs.length; i++) {
						if (wvs[i].id != page.id && wvs[i]) {
							wvs[i].close();
						}
					}
				}, 1000);
    }
    
	
iot.i18n(function (language) {
	console.log("进入login.js........");
	var openDialog = new Vue({
		el: '#container',
		data: {
	    	showFlag: false,
	    	ifhide:plus.os.name == "iOS"?"hide":"",
	    	checked:true,
	    	wxTip:false,
	    	nVersion:false,
	    	downloadUrl:"",
	    	fadeIn:"",
	    	isWxLoginShow:true,//微信登录是否显示
	    	isGuestShow:false,//游客登录是否显示
	    	isNormalModel:true,//普通模式
	    	isGuestModel:false,//游客模式
	    	isWxBtnShow:true//微信登录按钮是否显示 取决于是否安装了微信
		},
		mounted:function(){
         	getVersion();
         	this.fadeIn = "fadeIn";
         	this.isWxInstalled();
		},
		methods: {
			
			guestLogin:function (){
				console.log("游客登录....");
				plus.storage.setItem(config.KUTOKEN,config.KGUESTOKEN);
				plus.storage.setItem(config.KNICKNAME,"Guest");
				plus.storage.setItem(config.KPHOTO,"");
				plus.storage.setItem(config.KACHIEVEINFO,"true");
				plus.storage.setItem(config.KISGUEST,"true");
						
				console.log(config.KGUESTOKEN);
				openNewWindow();
			},
			//关闭提示框
			close: function () {
	        		this.showFlag= false;
	        		plus.runtime.quit();
	   	 	},
	    	//显示提示框
			open: function () {
				this.showFlag = true;
			},
			IKonw:function(){
				openDialog.wxTip = false;
			},
			agree:function(){
				checkIfLogin();
				this.showFlag= false;
				if(this.checked==true){
					plus.storage.setItem(config.KRULE,"true");
				}else{
					plus.storage.setItem(config.KRULE,"false");
				}
			},
			toDownload:function(){
//				this.nVersion = false;
				 plus.runtime.openURL(this.downloadUrl);
			},
			isWxInstalled:function(){
				WXLogin.isWxInstalled(function(ret){
					if(ret.code == "0"){
						console.log("未安装微信...");
					}else{
						console.log("安装了微信...");
					}
				},function(err){
					
				})
			}
		},
		watch:{
			checked:function(o,n){
				console.log(o)
				console.log(n)
			}
		}
	})
	
	plusReady();
	function plusReady(){
		var wxnativeLogin =  document.getElementById('wxnativeLogin');
         wxnativeLogin.addEventListener('tap',function(){
         				/* ***** 这里要删掉 测试代码*******/
//							console.log("微信未安装...");
//					        openDialog.wxTip = true;
//					        return;
					     /* ************/  
					     
					WXLogin.wxLogin(function(ret){
						console.log(ret);
						
						if(ret.hasOwnProperty("isWXAppInstalled")){
							console.log("微信未安装...");
					        openDialog.wxTip = true;
					        return;
					    }
						loginWx(ret.code);
					},function(err){
						mui.alert("微信授权失败");
						console.log("请求微信授权失败...");
					});
			});
	}
	
	function getECallInfo(){
	 	var utoken = plus.storage.getItem(config.KUTOKEN);
	 	if(utoken == null)
	 	return;
		uFetch(config.BASEURL+"user/getECallUser", {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json; charset=UTF-8',
						'authorization': 'JWT '+ utoken
					}
				}).then(function (ret) {
					if(ret.code == 0){
						//如果没有紧急联系人 ，直接更改
						plus.storage.setItem(config.KECALLNAME,ret.data.nickname);
						plus.storage.setItem(config.KECALLTEL,ret.data.mobile);
					}
				}).catch(function (err) {
					
				console.log(err);
				});
	 }
	
	function checkIfLogin(){
		var uToken =  plus.storage.getItem(config.KUTOKEN);
		if(uToken != null){
			autoLogin();
			openNewWindow();
		}
	}
	
	//自动登录autoLogin
	function autoLogin(){
		var utoken = plus.storage.getItem(config.KUTOKEN);
		uFetch(config.BASEURL+"user/autoLogin", {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json; charset=UTF-8',
						'authorization': 'JWT '+ utoken
					}
				}).then(function (ret) {
					console.log("自动登录成功返回");
					console.log(ret);
				}).catch(function (err) {
					console.log(err);
				});
	}
	
	function checkShowRule(){
//		return;
		var isRuleShow =  plus.storage.getItem(config.KRULE);
		if(isRuleShow == "true"){
			console.log("不在显示...");
			openDialog.showFlag = false;
			checkIfLogin();
		}else{
			console.log("显示...");
			openDialog.showFlag = true;
		}
	}
	
	function loginWx(code){
		uFetch(config.BASEURL+"user/wxLogin?type=op&code="+code, {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json; charset=UTF-8'
					}
				}).then(function (ret) {
					if(ret.code == 0){
						console.log(ret);
						
						plus.storage.setItem(config.KUTOKEN,ret.data.uToken);
						plus.storage.setItem(config.KNICKNAME,ret.data.nickname);
						plus.storage.setItem(config.KPHOTO,ret.data.head);
						
						if(ret.data.info != null){
							plus.storage.setItem(config.KACHIEVEINFO,"true");
						}
						//将utoken传给原生
						WXLogin.storeUtoken("utoken",ret.data.uToken,function(ret1){
							if(ret1.code == 0){
								console.log('存储成功');
							}
						},function(err){});
						WXLogin.storeUtoken("nickname",ret.data.nickname,function(ret1){
							if(ret1.code == 0){
								console.log('存储成功');
							}
						},function(err){});
						
						openNewWindow();
					}else{
						mui.alert("登录请求失败，请稍后再试");
					}
				}).catch(function (err) {
					console.log(err);
				});
	}
	
	function openNewWindow(){
		var personInfo =  plus.storage.getItem(config.KPERSONINFO);
		var info =  plus.storage.getItem(config.KACHIEVEINFO);
//		console.log("=======info========");
//		console.log(info);
//		console.log("=======info========");
		if(info!=null){
			
		}else {
			mui.openWindow({
						url:'./editMyInfo.html',
						id:'editMyInfo',
						waiting:{
      					autoShow:false,
      				}
				});
//			plus.webview.currentWebview().close(); 
			return;
		}
		var foo = plus.storage.getItem(config.KUTOKEN);
		console.log(foo);
		if(foo != null || foo!=""){
			 
			mui.openWindow({
						url:'./index.html',
						id:'index',
						waiting:{
      					autoShow:false,
      				}
				});
		}
	}
	
	function closeAllWindow(){
		var wvs=plus.webview.all();
		for(var i=0;i<wvs.length;i++){
			console.log(i);
			console.log(wvs[i]);
			console.log(wvs[i].getURL());
			console.log("webview"+i+": "+wvs[i].getURL());
		}
	}
	
	function transformVersion(v){
		var array = v.split(".");
		var floatVersion = "";
		console.log("下面是获取系统版本");
		console.log(array);
		if(array.length>2){
			for (var i = 0; i < array.length; i++) {
				if(i == 1){
					floatVersion = floatVersion + ".";
				}
				floatVersion = floatVersion + array[i];
			}
		}else{
			floatVersion = v;
		}
		if(isNaN(floatVersion)){
			return null;
		}
		
		return floatVersion;
	}
	
	function getVersion(){
		var v = plus.runtime.version;
		var floatVersion = transformVersion(v);
//		var array = v.split(".");
//		var floatVersion = "";
//		console.log("下面是获取系统版本");
//		console.log(array);
//		if(array.length>2){
//			for (var i = 0; i < array.length; i++) {
//				if(i == 1){
//					floatVersion = floatVersion + ".";
//				}
//				floatVersion = floatVersion + array[i];
//			}
//		}else{
//			floatVersion = v;
//		}
//		if(isNaN(floatVersion)){
//			return;
//		}
		console.log("========下面是转换后的版本信息========="+floatVersion);
		console.log(v);
		uFetch(config.BASEURL+"admin/getVersion", {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json; charset=UTF-8',
					}
				},"0").then(function (ret) {
					
					console.log("查看版本信息");
					console.log(ret.data);
					if(ret.code == 0){						
						openDialog.downloadUrl = ret.data.download_url;
						var netV = ret.data.android_version;
						var threshold = ret.data.threshold;
						
						var map = {"score":threshold.toString() };
						WXLogin.storeMap(map,function(ret){},function(err){});
						if(plus.os.name == "iOS"){//iOS
							netV = ret.data.ios_version;
						}
						console.log(netV);
						console.log(Number(floatVersion));
						netV = transformVersion(netV);
						console.log(netV);
						if(Number(netV) > Number(floatVersion)){
							openDialog.nVersion = true;
							console.log("当前版本不是最新版本。");
							return ;
						}else if(Number(netV) < Number(floatVersion)){
							openDialog.isWxLoginShow = false;
							openDialog.isGuestShow = true;
							
							openDialog.isGuestModel = true;
							openDialog.isNormalModel = false;
							console.log("当前版本大于服务器版本 需要显示访客登录界面。");
							// 获取当前手机是否安装了微信
							WXLogin.isWxInstalled(function(ret){
								if(ret.code == "0"){
									openDialog.isWxBtnShow = false;
									console.log("没有安装微信！！！！");
								}
							},function(err){
								console.log("安装了微信！！！！");
							})
					
						}else{
							openDialog.isWxLoginShow = true;
							openDialog.isGuestShow = false;
							
							openDialog.isGuestModel = false;
							openDialog.isNormalModel = true;
							
						}
						
					}
//					console.log("准备跳转。。。");
					checkShowRule();
				}).catch(function (err) {
//					console.log("查看版本信息错误，等待跳转");
					console.log(err);
					checkShowRule();
				});
		}
	
	});
});

