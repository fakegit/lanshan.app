var vm = new Vue({
    el: '#app',
    data: {
        "getlist_rsp": {
            "data": [{
                "title": "",
                "url": "",
                "msg": "",
                "imageUrl": "",
                "hosttitle": ""
            }]
        },
        "tips":"腾讯视频vip、爱奇艺vip、优酷土豆vip、bilibi大会员、芒果TV vip...全网好剧，即刻观看",
        "requerybtnflag":0,
        "querywd": null,
        "placeholder": "一拳超人",
        "page": 0, //查询次数
    },

    methods: {
        search: async function (url) {
            //向nodejs后端发送get请求,由后端调用外部引擎,解决跨域问题;
            this.tips = "正在努力搜索，请等待...";
            console.log(url);
            var list = await fetch(url).then(function (response) {
                return response.json();
            }).catch(e => console.log("Oops, error", e));
            console.log(list);
            return list;
        },
        requery:function(){
            this.requerybtnflag = 0 ;//重新查询时清除这个标记，否则按钮还在，查询之后马上还能再次重新查询，浪费服务器资源且需要再次等待；
            var a=[];
            localStorage.removeItem(this.querywd)//重新查询时清除这个关键字的缓存结果
            this.querypage();
        },
        querypage: async function () {
            this.querywd = this.querywd || this.placeholder; //若没有输入则查询提示的内容
            //重新查询之前，先看看本地缓存是否存在
            var cacheValuestr = localStorage.getItem(this.querywd);
            console.log(cacheValuestr);
            var cacheValue = JSON.parse(cacheValuestr);
            console.log(cacheValue);
            if(cacheValue){
                this.getlist_rsp.data = cacheValue;
                this.tips =  `您目前看到的是历史搜索结果...  您还可以`;
                this.requerybtnflag = 1 ;
            }else{
                //重新查询时，清空查询计数,结果数组
                this.page = 0;
                this.getlist_rsp.data = [];
                var newlist = await this.search('/search?wd=' + this.querywd + '&page=' + this.page);
                //console.log(newlist);
                this.getlist_rsp.data = newlist;
                //查询完成之后，存入本地缓存
                var jsonstr = JSON.stringify(this.getlist_rsp.data);
                localStorage.setItem(this.querywd,jsonstr);
                this.autoquerymore();
            }
        },
        querymore: async function () {
            this.requerybtnflag = 0 ;//查询更多时清除这个标记
            this.page += 1;
            this.querywd = this.querywd || this.placeholder;
            var newlist = await this.search('/search?wd=' + this.querywd + '&page=' + this.page); //需要新参数
            var oldlist = this.getlist_rsp.data;
            this.getlist_rsp.data.push.apply(oldlist, newlist);
            //查询完成之后，存入本地缓存
            var jsonstr = JSON.stringify(this.getlist_rsp.data);
            localStorage.setItem(this.querywd,jsonstr);
            this.autoquerymore();
        },
        autoquerymore: function () {
            var loaded = this.page + 1;
            var counts = this.getlist_rsp.data ? this.getlist_rsp.data.length : 0;
            //3次调用还未找到5个结果时将关闭自动查询，极有可能关键字错误，否则将无限查询下去；
            if (loaded >= 3 && counts < 5) {
                this.tips =  `使用${loaded}个引擎搜索到${counts}条结果,试试换个关键字...搜索完毕！`;
            } else if (counts < 5) {
                this.tips = `使用${loaded}个引擎搜索到${counts}条结果,即将调用更多引擎...`;
                this.querymore();
            } else if (counts >= 5) {
                this.tips = `使用${loaded}个引擎搜索到${counts}条结果，搜索完毕！`;
            }
        },
    }
});