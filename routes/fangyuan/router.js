const hostlist = require("./678.json");
const puppeteer = require('puppeteer');

async function route(wd,page) {
	var data = [];
	var once_nums = 1;
	//console.log("serach wd = " + wd);
	for (var i = 0; i < once_nums; i++) {
		//console.log("hostlist[%s] = ", i, hostlist[i].title);
		var index = i+page*once_nums;
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
			await page.waitFor(2000);
		} catch (e) {
			console.log(host.title, "Result SyncError", e); //引擎结果2,异步调用过程中出错
			// close browser
			browser.close();
			// exit code 1 indicating an error happened
			//code = 1;
			//process.emit("exit ");
			//process.reallyExit(code);
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
					//get title
					var titlestr = "";
					var t1 = $(item).find(title_ql[0]).attr(title_ql[1]);
					var t2 = $(item).find(title_ql[0] + " " + title_ql[1]).text().trim();
					var t3 = $(item).find(title_ql[0]).text().trim();
					if (t1) {
						titlestr = t1;
						//console.log("%s,t1=$('%s').find('%s').attr('%s')",host.title,item,title_ql[0],title_ql[1]);
					} else if (t2) {
						titlestr = t2;
						//console.log("%s,t2=$('%s').find('%s %s').text().trim()",host.title,item,title_ql[0],title_ql[1]);
					} else if (t3) {
						titlestr = t3;
						//console.log("%s,t3=$('%s').find('%s').text().trim()",host.title,item,title_ql[0]);
					}
					//get msg
					var msgstr = "";
					var msg_ql_fix = msg_ql[0].split(",");
					if (msg_ql_fix.length > 1) {
						var m0 = msg_ql_fix[0];
						var m1 = msg_ql_fix[1];
						msgstr = $($(item).find(m0)[m1]).text().trim();
						//console.log("%s,msg0=$($('%s').find('%s')[%s]).text().trim()",host.title,item,m0,m1);
					} else {
						msgstr1 = $(item).find(msg_ql[0]).attr(msg_ql[1]);
						msgstr2 = $(item).find(msg_ql[0] + msg_ql[1]).text().trim();
						msgstr3 = $(item).find(msg_ql[0]).text().trim();
						if (msgstr1) {
							msgstr = msgstr1;
							//console.log("%s,msg1=$('%s').find('%s').attr('%s') ",host.title,item,msg_ql[0],msg_ql[1]);
						} else if (msgstr2) {
							msgstr = msgstr2;
							//console.log("%s,msg2=,$('%s').find('%s%s').text().trim()",host.title,item,msg_ql[0],msg_ql[1]);				
						} else if (msgstr3) {
							msgstr = msgstr3;
							//console.log("%s,msg3=,$('%s').find('%s').text().trim()",host.title,item,msg_ql[0],msg_ql[1]);			
						}
					}

					//get url
					var urlstr = "";
					var url1 = $(item).find(url_ql[0]).attr(url_ql[1]);
					var url2 = (url_ql.length > 2) ? $(item).find(url_ql[0] + " " + url_ql[1]).attr(url_ql[2]) : "";
					if (url1) {
						urlstr = baseurl_fix + url1;
						//console.log("%s,url1=$('%s').find('%s').attr('%s')",host.title,item,url_ql[0],url_ql[1]);
					} else if (url2) {
						urlstr = baseurl_fix + url2;
						//console.log("%s,url2=$('%s').find('%s %s').attr('%s')",host.title,item,url_ql[0],url_ql[1],url_ql[2]);				
					}

					//get imageUrl
					var imageUrlstr = "";
					var img1 = $(item).find('img').attr('src');
					var img2 = $(item).find('dt a').attr('data-original');
					if (img1) {
						imageUrlstr = baseurl_fix + img1;
						//console.log("%s,img1=$('%s').find('img').attr('src')",host.title,item);
					} else if (img2) {
						imageUrlstr = baseurl_fix + img2;
						//console.log("%s,img2=$('%s').find('dt a').attr('data-original')",host.title,item);
					}

					if (!titlestr && !urlstr && !msgstr && !imageUrlstr) return;
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
		},host);//host参数放在这里

		console.log(host.title, "Result ok",results.length);//console.log(host.title, "Result ok", results); //引擎结果1,成功输出	
		// shutdown browser
		browser.close();

		return results; //不清楚能否返回正确的值

	} catch (e) {
		console.log(host.title, "Result CodeError", e, host.searchFind); //引擎结果3,代码解析出错
		return [];
	}
}

exports.route = route;