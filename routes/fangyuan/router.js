const hostlist = require("./678.json");
const puppeteer = require('puppeteer');

async function route(wd, page) {
	var data = [];
	var once_nums = 1;
	//console.log("serach wd = " + wd);
	for (var i = 0; i < once_nums; i++) {
		//console.log("hostlist[%s] = ", i, hostlist[i].title);
		var index = i + page * once_nums;
		if (index < hostlist.length) {
			newlist = await getlist(hostlist[index], wd);
			//追加新的list
			var oldlist = data;
			data.push.apply(oldlist, newlist);
		} else {
			console.log("没有更多的host了");
		}
	}
	//console.log("route", data);
	return data;
}

async function getlist(host, wd) {
	try {
		var url = host.searchUrl.replace("**", wd);
		console.log(host.title, url);

		// browser
		const browser = await (puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		}));
		const page = await browser.newPage();
		try {
			await page
				.mainFrame()
				.addScriptTag({
					url: 'https://cdn.bootcss.com/jquery/3.2.0/jquery.min.js'
				});
			await page.goto(url, {
				waitUntil: 'domcontentloaded'
			});
			await page.waitFor(3000); //页面加载后等待3s,解决99%图片慢加载问题;
		} catch (e) {
			console.log(host.title, "Result SyncError", e); //引擎结果2,异步调用过程中出错
			browser.close();
			return [];
		}

		//parse
		const results = await page.evaluate((host) => {
			var results = [];

			let str = host.baseUrl;
			var baseurl_fix = str;
			if (str[str.length - 1] == '/') {
				baseurl_fix = str.substring(0, str.length - 1)
			}
			let s = host.searchFind.split(";");
			let list_q = s[0].replace("&&", " ");
			let title_ql = s[1].split("&&");
			let url_ql = s[2].split("&&");
			let msg_ql = (s.length >= 4) ? s[3].split("&&") : "span&&.fed-list-remarks".split("&&");
			//console.log("%s,list_query=$('%s')",host.title,list_q);

			let items = $(list_q);
			if (items.length >= 1) {
				items.each((index, item) => {
					let el = $(item);
					//get title
					function gettitle(el, title_ql) {
						var t1 = el.find(title_ql[0]).attr(title_ql[1]);
						var t2 = el.find(title_ql[0] + " " + title_ql[1]).text().trim();
						var t3 = el.find(title_ql[0]).text().trim();
						//console.log("%s,t1=$('%s').find('%s').attr('%s')",host.title,item,title_ql[0],title_ql[1]);
						//console.log("%s,t2=$('%s').find('%s %s').text().trim()",host.title,item,title_ql[0],title_ql[1]);
						//console.log("%s,t3=$('%s').find('%s').text().trim()",host.title,item,title_ql[0]);
						return t1 ? t1 : t2 ? t2 : t3 ? t3 : "";
					}
					var titlestr = gettitle(el, title_ql);
					if (!titlestr) return;

					//get msg
					function getmsg(el, msg_ql) {
						var msg_ql_fix = msg_ql[0].split(",");
						if (msg_ql_fix.length > 1) {
							var m0 = msg_ql_fix[0];
							var m1 = msg_ql_fix[1];
							msgstr0 = $(el.find(m0)[m1]).text().trim();
							//console.log("%s,msg0=$($('%s').find('%s')[%s]).text().trim()",host.title,item,m0,m1);
							return msgstr0;
						} else {
							msgstr1 = el.find(msg_ql[0]).attr(msg_ql[1]);
							msgstr2 = el.find(msg_ql[0] + msg_ql[1]).text().trim();
							msgstr3 = el.find(msg_ql[0]).text().trim();
							//console.log("%s,msg1=$('%s').find('%s').attr('%s') ",host.title,item,msg_ql[0],msg_ql[1]);
							//console.log("%s,msg2=,$('%s').find('%s%s').text().trim()",host.title,item,msg_ql[0],msg_ql[1]);
							//console.log("%s,msg3=,$('%s').find('%s').text().trim()",host.title,item,msg_ql[0],msg_ql[1]);								
							return msgstr1 ? msgstr1 : msgstr2 ? msgstr2 : msgstr3 ? msgstr3 : "";
						}
					}
					var msgstr = getmsg(el, msg_ql);
					if (!msgstr) return;

					function urlfix(baseurl_fix, url) {
						var a = baseurl_fix.split('.');
						var b = a[a.length - 2];
						if (url.indexOf(b) != -1 || url.indexOf("www") != -1 || url.indexOf("com") != -1 || url.indexOf("cn") != -1) {
							return url;
						} else {

							return baseurl_fix + url;
						}
					}

					//get url
					function geturl(el, url_ql) {
						var urlstr = "";
						var url1 = el.find(url_ql[0]).attr(url_ql[1]);
						var url2 = (url_ql.length > 2) ? el.find(url_ql[0] + " " + url_ql[1]).attr(url_ql[2]) : "";
						//console.log("%s,url1=$('%s').find('%s').attr('%s')",host.title,item,url_ql[0],url_ql[1]);
						//console.log("%s,url2=$('%s').find('%s %s').attr('%s')",host.title,item,url_ql[0],url_ql[1],url_ql[2]);
						var url = url1 ? url1 : url2 ? url2 : "";
						return url ? urlfix(baseurl_fix, url) : "";

					}
					var urlstr = geturl(el, url_ql);
					//if (!urlstr) return;

					//get imageUrl
					function getimgurl(el) {
						var imageUrlstr = "";
						var img1 = el.find('img').attr('src');
						var img2 = el.find('dt a').attr('data-original');
						//console.log("%s,img1=$('%s').find('img').attr('src')",host.title,item);
						//console.log("%s,img2=$('%s').find('dt a').attr('data-original')",host.title,item);
						img = img1 ? img1 : img2 ? img2 : "";
						return img ? urlfix(baseurl_fix, img) : "";
					}
					var imageUrlstr = getimgurl(el);
					//if (!imageUrlstr) return;

					results.push({
						title: titlestr,
						url: urlstr,
						msg: msgstr,
						imageUrl: imageUrlstr,
						hosttitle: host.title
					});

				});
			}
			//console.log(results);
			return results;
		}, host); //host参数放在这里

		console.log(host.title, "Result ok", results.length); //console.log(host.title, "Result ok", results); //引擎结果1,成功输出	

		browser.close();

		return results;

	} catch (e) {
		console.log(host.title, "Result CodeError", e, host.searchFind); //引擎结果3,代码解析出错
		return [];
	}
}

exports.route = route;