
var vm = new Vue({
    el: '#app-4',
    data: {
        "getlist_url": "http://66yy.in/index.php?m=vod-search&wd=**", //&pg=&t=
        "getlist_rsp": {
            "data": [{
                "title": "",
                "url": "",
                "msg": "",
                "imageUrl": "",
                "hosttitle": ""
            }]
        },
        "classid": "",
        "querywd": null,
        "placeholder": "西行纪",
        "page":0,//查询次数
    },

    methods: {
        search: async function (url) {
            //向nodejs后端发送get请求,由后端调用外部引擎,解决跨域问题;
            console.log(url);
            var list = await fetch(url).then(function (response) {
                    return response.json();
                }).catch(e => console.log("Oops, error", e));
            console.log(list);
            return list;
        },
        querypage: async function () {
            //重新查询时，清空查询计数,结果数组
            this.page = 0;
            this.getlist_rsp.data = [];
            this.querywd = this.querywd || this.placeholder; //若没有输入则查询提示的内容
            var newlist = await this.search('/search?wd=' + this.querywd + '&page=' + this.page);
            console.log(newlist);
            this.getlist_rsp.data = newlist;
            this.autoquerymore();
        },
        querymore: async function () {
            this.page += 1;
            this.querywd = this.querywd || this.placeholder;
            var newlist = await this.search('/search?wd=' + this.querywd + '&page=' + this.page);//需要新参数
            var oldlist = this.getlist_rsp.data;
            this.getlist_rsp.data.push.apply(oldlist, newlist);
            this.autoquerymore();
        },
        autoquerymore: function () {
            //使用了几个引擎客户端不再关心，不可见，只关心查到了几条够不够；故策略改为少于10条时自动查询；
            var loaded = this.page + 1;
            var counts = this.getlist_rsp.data?this.getlist_rsp.data.length:0;

            //3次调用还未找到10个结果时将关闭自动查询，极有可能关键字错误，否则将无限查询下去；
            if (loaded >= 3 && counts < 5) {
                console.log("%s次调用查询到%s条结果,试试换个关键字...", loaded, counts);
            } else if (counts < 10) {
                console.log("%s次调用查询到%s条结果,即将使用更多引擎...", loaded, counts);
                this.querymore();
            } else if (counts >= 10) {
                console.log("%s次调用查询到%s条结果！", loaded, counts);
            }
        },
    }
});