var express = require('express');
var bodyParser = require('body-parser');
var router = require("./routes/fangyuan/router");

var app = express();

// 创建 application/x-www-form-urlencoded 编码解析
var urlencodedParser = bodyParser.urlencoded({
	extended: false
})

app.use('/public', express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + "/" + "index.html");
})

app.get('/search', async function (req, res) {
	// 输出 JSON 格式
	res.writeHead(200, {
		'Content-Type': 'text/html;charset=utf-8'
	}); //设置response编码为utf-8
	console.log('/search %s %s',req.query.wd,req.query.page);
	var data = await router.route(req.query.wd,req.query.page);
	console.log(data);
	res.end(JSON.stringify(data));
})


var server = app.listen(80, function () {
	var host = server.address().address
	var port = server.address().port
	console.log("应用实例，访问地址为 http://%s:%s", host, port)
})