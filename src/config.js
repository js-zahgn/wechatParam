const config = {
  // 待监听函数的特殊标识
  actionMark: "_x",
  appLifeCircle: ["onLaunch", "onShow", "onHide", "onError"],
  pageLifeCircle: ["onLoad", "onShow", "onReady", "onHide", "onUnload"],
  componentLifeCircle: ["created", "attached", "ready", "moved", "detached"],
};
export default config;