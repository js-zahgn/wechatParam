const appLifeCircle = ["onLaunch", "onShow", "onHide", "onError"];
const pageLifeCircle = ["onLoad", "onShow", "onReady", "onHide", "onUnload"];
const componentLifeCircle = ["created", "attached", "ready", "moved", "detached"];
// 保存原生构造函数
const oldApp = App, OldPage = Page, OldComponent = Component;

class Queue{
  constructor() {
    this.items = [];
  }
  // 将数据上报数据
  request(item) {
    const _this = this;
    return new Promise((resolve, reject) => {
      wx.request({
        url: "api",
        method: "post",
        data: item,
        header: { "content-type": "application/json" },
        success: function (res) {
          resolve(res.data);
          _this.deQueue();
        },
        fail: function (err) {
          reject(err);
        }
      });
    });
  }
  // 入队
  enQueue(item) {
    this.items.push(item);
    this.request(item);
  }
  // 出队
  deQueue() {
    return this.items.shift();
  }
  front() {
    return this.items[0];
  }
  size() {
    return this.items.length;
  }
  clear() {
    this.items = [];
  }
  print() {
    console.log(this.items);
  }
}

const queue = new Queue();

function report(name, args, page) {
  const currentPage = getCurrentPages();
  const params = {
    event: {
      createAt: new Date().getTime(),
      name,
      args
    },
    page: {
      nodeId: page.__wxExparserNodeId__,
      display: page.__displayReporter,
      sourceUrl: currentPage[currentPage.length - 1].route
    }
  };
  queue.enQueue(params);
}

const fnProxy = (name, event) => {
  return function () {
    const arg = arguments;
    const result = event.apply(this, arg);
    if (result instanceof Promise) {
      result.then(() => {
        report(name, arg, this);
      });
    } else {
      report(name, arg, this);
    }
    return result;
  };
};

Component = function (conf) {
  const { methods } = conf;
  // 监听组件生命周期是否有意义
  componentLifeCircle.map(fnName => {
    conf[fnName] && (conf[fnName] = fnProxy(fnName, conf[fnName]));
  });
  methods && Object.keys(methods).map(fnName => {
    // 判断是否监听事件,写监听事件时要加上标识
    if (fnName.indexOf("_") > -1) {
      conf.methods[fnName] = fnProxy(fnName, methods[fnName]);
    }
  });
  return OldComponent(conf);
};

Page = function (conf) {
  pageLifeCircle.map(fnName => {
    conf[fnName] && (conf[fnName] = fnProxy(fnName, conf[fnName]));
  });
  Object.keys(conf).map(fnName => {
    // 判断是否监听事件,写监听事件时要加上标识
    if (fnName.indexOf("_") > -1) {
      conf[fnName] = fnProxy(fnName, conf[fnName]);
    }
  });
  return OldPage(conf);
};

App = function (conf) {
    appLifeCircle.map(fnName => {
        let oldMethod = conf[fnName];
        conf[fnName] = function (args) {
            oldMethod.call(this, (typeof args) === "undefined" ? "" : args);
            report(fnName, args, this);
        };
    });
    return oldApp(conf);
};
export default {App, Page, Component};
