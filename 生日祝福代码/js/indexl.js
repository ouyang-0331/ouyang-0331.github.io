// 定义一个对象S，包含初始化方法

var S = {
  init: function () {
    // 初始化变量m

    var m = 0;

    // 获取当前页面的URL

    var action = window.location.href,
      // 查找URL中是否包含'?a='

      i = action.indexOf("?a=");

    // 初始化绘图模块

    S.Drawing.init(".canvas");

    // 添加类名表示页面已准备好

    document.body.classList.add("body--ready");

    // 如果URL中包含'?a='

    if (i !== -1) {
      // 解码并截取参数值，模拟执行

      S.UI.simulate(decodeURI(action).substring(i + 3));
    } else {
      // 模拟执行默认的生日祝福语

      S.UI.simulate(
        "Hi 也也小公主|周也小朋友|也也生日快乐|也子天天开心|#countdown 3||"
      );
    }

    // 开始绘图循环

    S.Drawing.loop(function () {
      m++;

      // 渲染形状

      S.Shape.render();

      //console.log(m);

      if (m == 700) {
        // 跳转到生日蛋糕页面

        window.location.href = "../html/BirthdayCake.html";
      }
    });
  },
};

// 定义绘图模块

S.Drawing = (function () {
  var canvas, context, renderFn;

  // 获取浏览器的requestAnimationFrame方法，用于优化动画

  requestFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };

  return {
    init: function (el) {
      // 获取canvas元素

      canvas = document.querySelector(el);

      // 获取canvas的2D绘图上下文

      context = canvas.getContext("2d");

      // 调整canvas大小

      this.adjustCanvas();

      // 监听窗口大小变化事件，调整canvas大小

      window.addEventListener("resize", function (e) {
        S.Drawing.adjustCanvas();
      });
    },

    loop: function (fn) {
      // 如果renderFn未定义，初始化为fn

      renderFn = !renderFn ? fn : renderFn;

      // 清除当前帧

      this.clearFrame();

      // 执行渲染函数

      renderFn();

      // 请求下一帧

      requestFrame.call(window, this.loop.bind(this));
    },

    adjustCanvas: function () {
      // 调整canvas的宽度和高度

      canvas.width = window.innerWidth - 20;

      canvas.height = window.innerHeight - 20;
    },

    clearFrame: function () {
      // 清除canvas上的所有内容

      context.clearRect(0, 0, canvas.width, canvas.height);
    },

    getArea: function () {
      // 返回canvas的宽度和高度

      return { w: canvas.width, h: canvas.height };
    },

    drawCircle: function (p, c) {
      // 设置填充颜色

      context.fillStyle = c.render();

      // 开始绘制路径

      context.beginPath();

      // 绘制圆

      context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);

      // 结束绘制路径

      context.closePath();

      // 填充圆

      context.fill();
    },
  };
})();

// 定义用户界面模块

S.UI = (function () {
  var input = document.querySelector(".ui-input"),
    ui = document.querySelector(".ui"),
    help = document.querySelector(".help"),
    commands = document.querySelector(".commands"),
    overlay = document.querySelector(".overlay"),
    canvas = document.querySelector(".canvas"),
    interval,
    isTouch = false, //('ontouchstart' in window || navigator.msMaxTouchPoints),
    currentAction,
    resizeTimer,
    time,
    maxShapeSize = 30,
    firstAction = true,
    sequence = [],
    cmd = "#";

  function formatTime(date) {
    // 获取当前时间的小时和分钟

    var h = date.getHours(),
      m = date.getMinutes(),
      // 如果分钟小于10，前面补0

      m = m < 10 ? "0" + m : m;

    // 返回格式化的时间

    return h + ":" + m;
  }

  function getValue(value) {
    // 获取参数值

    return value && value.split(" ")[1];
  }

  function getAction(value) {
    // 获取参数值

    value = value && value.split(" ")[0];

    // 如果参数值以cmd开头，返回参数值

    return value && value[0] === cmd && value.substring(1);
  }

  function timedAction(fn, delay, max, reverse) {
    // 清除现有的定时器

    clearInterval(interval);

    // 初始化当前动作

    currentAction = reverse ? max : 1;

    // 执行动作函数

    fn(currentAction);

    // 如果最大值未定义或当前动作未达到最大值

    if (
      !max ||
      (!reverse && currentAction < max) ||
      (reverse && currentAction > 0)
    ) {
      // 设置定时器，每隔delay毫秒执行一次动作函数

      interval = setInterval(function () {
        currentAction = reverse ? currentAction - 1 : currentAction + 1;

        fn(currentAction);

        // 如果当前动作达到最大值或最小值，清除定时器

        if (
          (!reverse && max && currentAction === max) ||
          (reverse && currentAction === 0)
        ) {
          clearInterval(interval);
        }
      }, delay);
    }
  }

  function reset(destroy) {
    // 清除现有的定时器

    clearInterval(interval);

    // 重置序列和时间

    sequence = [];

    time = null;

    // 如果需要销毁当前形状

    destroy && S.Shape.switchShape(S.ShapeBuilder.letter(""));
  }

  function performAction(value) {
    var action, value, current;

    // 移除覆盖层的可见类名

    overlay.classList.remove("overlay--visible");

    // 如果value是对象，将其转换为序列

    sequence =
      typeof value === "object" ? value : sequence.concat(value.split("|"));

    // 清空输入框

    input.value = "";

    // 检查输入框宽度

    checkInputWidth();

    // 执行序列中的每个动作

    timedAction(
      function (index) {
        current = sequence.shift();

        action = getAction(current);

        value = getValue(current);

        // 根据动作类型执行不同的操作

        switch (action) {
          case "countdown":
            value = parseInt(value) || 10;

            value = value > 0 ? value : 10;

            // 执行倒计时动作

            timedAction(
              function (index) {
                if (index === 0) {
                  if (sequence.length === 0) {
                    S.Shape.switchShape(S.ShapeBuilder.letter(""));
                  } else {
                    performAction(sequence);
                  }
                } else {
                  S.Shape.switchShape(S.ShapeBuilder.letter(index), true);
                }
              },

              1000,

              value,

              true
            );

            break;

          case "rectangle":
            value = value && value.split("x");

            value =
              value && value.length === 2
                ? value
                : [maxShapeSize, maxShapeSize / 2];

            // 绘制矩形

            S.Shape.switchShape(
              S.ShapeBuilder.rectangle(
                Math.min(maxShapeSize, parseInt(value[0])),

                Math.min(maxShapeSize, parseInt(value[1]))
              )
            );

            break;

          case "circle":
            value = parseInt(value) || maxShapeSize;

            value = Math.min(value, maxShapeSize);

            // 绘制圆形

            S.Shape.switchShape(S.ShapeBuilder.circle(value));

            break;

          case "time":
            var t = formatTime(new Date());

            if (sequence.length > 0) {
              // 切换形状为当前时间

              S.Shape.switchShape(S.ShapeBuilder.letter(t));
            } else {
              // 每秒更新时间

              timedAction(function () {
                t = formatTime(new Date());

                if (t !== time) {
                  time = t;

                  S.Shape.switchShape(S.ShapeBuilder.letter(time));
                }
              }, 1000);
            }

            break;

          default:
            // 切换形状为默认值

            S.Shape.switchShape(
              S.ShapeBuilder.letter(current[0] === cmd ? "What?" : current)
            );
        }
      },

      2000,

      sequence.length
    );
  }

  function checkInputWidth(e) {
    // 如果输入框内容长度超过18，添加宽类名

    if (input.value.length > 18) {
      ui.classList.add("ui--wide");
    } else {
      // 否则移除宽类名

      ui.classList.remove("ui--wide");
    }

    // 如果是第一次操作且输入框内容不为空，添加进入类名

    if (firstAction && input.value.length > 0) {
      ui.classList.add("ui--enter");
    } else {
      // 否则移除进入类名

      ui.classList.remove("ui--enter");
    }
  }

  // 绑定事件函数，用于处理键盘和鼠标事件

  function bindEvents() {
    document.body.addEventListener("keydown", function (e) {
      // 将焦点设置到输入框

      input.focus();

      // 如果按下的是回车键

      if (e.keyCode === 13) {
        // 标记首次操作已完成

        firstAction = false;

        // 重置状态

        reset();

        // 执行操作

        performAction(input.value);
      }
    });

    // 监听输入框的输入事件

    input.addEventListener("input", checkInputWidth);

    // 监听输入框的改变事件

    input.addEventListener("change", checkInputWidth);

    // 监听输入框的聚焦事件

    input.addEventListener("focus", checkInputWidth);

    // 监听帮助按钮的点击事件

    help.addEventListener("click", function (e) {
      // 切换遮罩层的可见性

      overlay.classList.toggle("overlay--visible");

      // 如果遮罩层可见，重置状态

      overlay.classList.contains("overlay--visible") && reset(true);
    });

    // 监听命令按钮的点击事件

    commands.addEventListener("click", function (e) {
      var el, info, demo, tab, active, url;

      // 获取点击的目标元素

      if (e.target.classList.contains("commands-item")) {
        el = e.target;
      } else {
        el = e.target.parentNode.classList.contains("commands-item")
          ? e.target.parentNode
          : e.target.parentNode.parentNode;
      }

      // 获取命令信息和示例

      info = el && el.querySelector(".commands-item-info");

      demo = el && info.getAttribute("data-demo");

      url = el && info.getAttribute("data-url");

      // 如果存在命令信息

      if (info) {
        // 隐藏遮罩层

        overlay.classList.remove("overlay--visible");

        // 如果存在示例

        if (demo) {
          // 设置输入框的值为示例

          input.value = demo;

          // 如果是触摸设备

          if (isTouch) {
            // 重置状态并执行操作

            reset();

            performAction(input.value);
          } else {
            // 将焦点设置到输入框

            input.focus();
          }
        } else if (url) {
          //window.location = url;
        }
      }
    });

    // 监听画布的点击事件

    canvas.addEventListener("click", function (e) {
      // 隐藏遮罩层

      overlay.classList.remove("overlay--visible");
    });
  }

  // 初始化函数，绑定事件并设置输入框焦点

  function init() {
    bindEvents();

    input.focus();

    isTouch && document.body.classList.add("touch");
  }

  // Init

  init();

  return {
    simulate: function (action) {
      // 执行模拟操作

      performAction(action);
    },
  };
})();

S.UI.Tabs = (function () {
  var tabs = document.querySelector(".tabs"),
    labels = document.querySelector(".tabs-labels"),
    triggers = document.querySelectorAll(".tabs-label"),
    panels = document.querySelectorAll(".tabs-panel");

  // 激活指定的标签和面板

  function activate(i) {
    triggers[i].classList.add("tabs-label--active");

    panels[i].classList.add("tabs-panel--active");
  }

  // 绑定标签点击事件

  function bindEvents() {
    labels.addEventListener("click", function (e) {
      var el = e.target,
        index;

      // 如果点击的是标签

      if (el.classList.contains("tabs-label")) {
        // 移除所有标签和面板的激活状态

        for (var t = 0; t < triggers.length; t++) {
          triggers[t].classList.remove("tabs-label--active");

          panels[t].classList.remove("tabs-panel--active");

          // 记录点击的标签索引

          if (el === triggers[t]) {
            index = t;
          }
        }

        // 激活点击的标签和面板

        activate(index);
      }
    });
  }

  // 初始化函数，激活第一个标签并绑定事件

  function init() {
    activate(0);

    bindEvents();
  }

  // Init

  init();
})();

S.Point = function (args) {
  // 定义点的x坐标

  this.x = args.x;

  // 定义点的y坐标

  this.y = args.y;

  // 定义点的z坐标

  this.z = args.z;

  // 定义点的透明度

  this.a = args.a;

  // 定义点的高度

  this.h = args.h;
};

S.Color = function (r, g, b, a) {
  // 定义颜色的红色分量

  this.r = r;

  // 定义颜色的绿色分量

  this.g = g;

  // 定义颜色的蓝色分量

  this.b = b;

  // 定义颜色的透明度

  this.a = a;
};

S.Color.prototype = {
  // 渲染颜色的方法

  render: function () {
    return "rgba(" + this.r + "," + +this.g + "," + this.b + "," + this.a + ")";
  },
};

S.Dot = function (x, y) {
  // 创建一个点对象

  this.p = new S.Point({
    x: x,

    y: y,

    z: 5,

    a: 1,

    h: 0,
  });

  // 定义点的移动速度

  this.e = 0.07;

  // 定义点是否处于静态

  this.s = true;

  // 定义点的目标位置

  this.c = new S.Color(255, 255, 255, this.p.a);

  // 定义点的路径队列

  this.t = this.clone();

  this.q = [];
};

S.Dot.prototype = {
  // 克隆点对象的方法

  clone: function () {
    return new S.Point({
      x: this.x,

      y: this.y,

      z: this.z,

      a: this.a,

      h: this.h,
    });
  },

  // 绘制点的方法

  _draw: function () {
    this.c.a = this.p.a;

    S.Drawing.drawCircle(this.p, this.c);
  },

  // 移动点的方法

  _moveTowards: function (n) {
    var details = this.distanceTo(n, true),
      dx = details[0],
      dy = details[1],
      d = details[2],
      e = this.e * d;

    // 如果点的高度为-1

    if (this.p.h === -1) {
      // 直接设置点的位置为目标位置

      this.p.x = n.x;

      this.p.y = n.y;

      return true;
    }

    // 如果距离大于1

    if (d > 1) {
      // 计算并更新点的位置

      this.p.x -= (dx / d) * e;

      this.p.y -= (dy / d) * e;
    } else {
      // 如果点的高度大于0

      if (this.p.h > 0) {
        // 减少点的高度

        this.p.h--;
      } else {
        // 移动完成

        return true;
      }
    }

    // 移动未完成

    return false;
  },

  // 更新点的状态

  _update: function () {
    if (this._moveTowards(this.t)) {
      var p = this.q.shift();

      if (p) {
        // 更新目标位置

        this.t.x = p.x || this.p.x;

        this.t.y = p.y || this.p.y;

        this.t.z = p.z || this.p.z;

        this.t.a = p.a || this.p.a;

        this.p.h = p.h || 0;
      } else {
        // 如果点处于静态

        if (this.s) {
          // 随机移动点的位置

          this.p.x -= Math.sin(Math.random() * 3.142);

          this.p.y -= Math.sin(Math.random() * 3.142);
        } else {
          // 非静态移动

          this.move(
            new S.Point({
              x: this.p.x + Math.random() * 50 - 25,

              y: this.p.y + Math.random() * 50 - 25,
            })
          );
        }
      }
    }

    // 更新点的透明度

    d = this.p.a - this.t.a;

    this.p.a = Math.max(0.1, this.p.a - d * 0.05);

    // 更新点的z坐标

    d = this.p.z - this.t.z;

    this.p.z = Math.max(1, this.p.z - d * 0.05);
  },

  // 计算与另一个点的距离

  distanceTo: function (n, details) {
    // 计算x轴上的距离

    var dx = this.p.x - n.x,
      // 计算y轴上的距离

      dy = this.p.y - n.y,
      // 计算欧几里得距离

      d = Math.sqrt(dx * dx + dy * dy);

    // 如果需要详细信息，返回一个包含dx, dy, d的数组，否则只返回d

    return details ? [dx, dy, d] : d;
  },

  // 移动点

  move: function (p, avoidStatic) {
    // 如果不避免静态点或避免静态点但距离大于1

    if (!avoidStatic || (avoidStatic && this.distanceTo(p) > 1)) {
      // 将点添加到队列中

      this.q.push(p);
    }
  },

  // 渲染点

  render: function () {
    // 更新点的位置

    this._update();

    // 绘制点

    this._draw();
  },
};

// 定义一个形状生成器

S.ShapeBuilder = (function () {
  // 定义点之间的间隔

  var gap = 13,
    // 创建一个canvas元素

    shapeCanvas = document.createElement("canvas"),
    // 获取canvas的2D绘图上下文

    shapeContext = shapeCanvas.getContext("2d"),
    // 定义字体大小

    fontSize = 300,
    // 定义字体样式

    fontFamily = "Avenir, Helvetica Neue, Helvetica, Arial, sans-serif";

  // 调整canvas大小以适应窗口

  function fit() {
    // 设置canvas宽度为窗口宽度的整数倍

    shapeCanvas.width = Math.floor(window.innerWidth / gap) * gap;

    // 设置canvas高度为窗口高度的整数倍

    shapeCanvas.height = Math.floor(window.innerHeight / gap) * gap;

    // 设置填充颜色为红色

    shapeContext.fillStyle = "red";

    // 设置文本基线为中间

    shapeContext.textBaseline = "middle";

    // 设置文本对齐方式为居中

    shapeContext.textAlign = "center";
  }

  // 处理canvas，生成点

  function processCanvas() {
    // 获取canvas的像素数据

    var pixels = shapeContext.getImageData(
      0,

      0,

      shapeCanvas.width,

      shapeCanvas.height
    ).data;

    // 存储生成的点

    (dots = []),
      // 像素数据

      pixels,
      // 当前x坐标

      (x = 0),
      // 当前y坐标

      (y = 0),
      // 最大x坐标

      (fx = shapeCanvas.width),
      // 最大y坐标

      (fy = shapeCanvas.height),
      // 当前宽度

      (w = 0),
      // 当前高度

      (h = 0);

    // 遍历像素数据

    for (var p = 0; p < pixels.length; p += 4 * gap) {
      // 如果当前像素不透明

      if (pixels[p + 3] > 0) {
        // 创建一个新点并添加到dots数组

        dots.push(
          new S.Point({
            x: x,

            y: y,
          })
        );

        // 更新最大宽度

        w = x > w ? x : w;

        // 更新最大高度

        h = y > h ? y : h;

        // 更新最小宽度

        fx = x < fx ? x : fx;

        // 更新最小高度

        fy = y < fy ? y : fy;
      }

      // 更新x坐标

      x += gap;

      // 如果x坐标超过canvas宽度

      if (x >= shapeCanvas.width) {
        // 重置x坐标

        x = 0;

        // 更新y坐标

        y += gap;

        // 跳过一行像素

        p += gap * 4 * shapeCanvas.width;
      }
    }

    // 返回生成的点及其边界

    return { dots: dots, w: w + fx, h: h + fy };
  }

  // 设置字体大小

  function setFontSize(s) {
    shapeContext.font = "bold " + s + "px " + fontFamily;
  }

  // 检查是否为数字

  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  // 初始化形状生成器

  function init() {
    fit();

    // 监听窗口大小变化事件，调整canvas大小

    window.addEventListener("resize", fit);
  }

  // Init

  init();

  return {
    // 从图像文件生成形状

    imageFile: function (url, callback) {
      var image = new Image(),
        // 获取绘图区域

        a = S.Drawing.getArea();

      // 图像加载成功后

      image.onload = function () {
        // 清除canvas内容

        shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);

        // 绘制图像

        shapeContext.drawImage(this, 0, 0, a.h * 0.6, a.h * 0.6);

        // 处理canvas并调用回调函数

        callback(processCanvas());
      };

      // 图像加载失败后

      image.onerror = function () {
        // 调用回调函数，生成一个默认的字母形状

        callback(S.ShapeBuilder.letter("What?"));
      };

      // 设置图像源

      image.src = url;
    },

    // 生成圆形形状

    circle: function (d) {
      var r = Math.max(0, d) / 2;

      // 清除canvas内容

      shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);

      // 开始绘制路径

      shapeContext.beginPath();

      // 绘制圆形

      shapeContext.arc(r * gap, r * gap, r * gap, 0, 2 * Math.PI, false);

      // 填充圆形

      shapeContext.fill();

      // 结束绘制路径

      shapeContext.closePath();

      // 处理canvas并返回生成的点及其边界

      return processCanvas();
    },

    // 生成字母形状

    letter: function (l) {
      var s = 0;

      // 计算字体大小，确保字体总高度不会超出画布

      var maxFontSize = Math.min(
        (shapeCanvas.width / shapeContext.measureText(l).width) *
          0.8 *
          fontSize, // 字符宽度适配

        (shapeCanvas.height / l.length) * 0.8 // 确保字体总高度不超出画布
      );

      s = Math.min(maxFontSize, fontSize); // 最终字体大小

      // 确保字体大小合适

      setFontSize(s);

      // 清空画布

      shapeContext.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);

      // 调试信息：检查字体大小

      console.log("Font size:", s);

      // 设置起始位置，确保文本不超出画布

      var startX = shapeCanvas.width / 2; // 水平居中

      var startY = Math.max(shapeCanvas.height / 2 - (l.length * s) / 2, s); // 垂直居中，避免超出顶部

      // 调试信息：查看开始的坐标

      console.log("Start position: X=" + startX + " Y=" + startY);

      // 绘制每个字，竖直排列

      for (var i = 0; i < l.length; i++) {
        // 调试信息：每个字的绘制位置

        console.log("Drawing letter at X=" + startX + " Y=" + (startY + i * s));

        shapeContext.fillText(l[i], startX, startY + i * s); // 每个字在竖直方向的间距是s
      }

      return processCanvas(); // 返回处理后的画布数据
    },

    // 生成矩形形状

    rectangle: function (w, h) {
      var dots = [],
        // 计算矩形宽度

        width = gap * w,
        // 计算矩形高度

        height = gap * h;

      // 遍历矩形的每个点

      for (var y = 0; y < height; y += gap) {
        for (var x = 0; x < width; x += gap) {
          // 创建一个新点并添加到dots数组

          dots.push(
            new S.Point({
              x: x,

              y: y,
            })
          );
        }
      }

      // 返回生成的点及其边界

      return { dots: dots, w: width, h: height };
    },
  };
})();

// 定义一个形状类

S.Shape = (function () {
  var dots = [],
    // 形状宽度

    width = 0,
    // 形状高度

    height = 0,
    // 形状中心x坐标

    cx = 0,
    // 形状中心y坐标

    cy = 0;

  // 调整形状位置以居中

  function compensate() {
    var a = S.Drawing.getArea();

    // 计算形状的x偏移量

    cx = a.w / 2 - width / 2;

    // 计算形状的y偏移量

    cy = a.h / 2 - height / 2;
  }

  return {
    // 随机移动空闲点

    shuffleIdle: function () {
      // 获取绘图区域

      var a = S.Drawing.getArea();

      // 遍历所有点

      for (var d = 0; d < dots.length; d++) {
        // 如果点未被激活

        if (!dots[d].s) {
          // 随机移动点

          dots[d].move({
            x: Math.random() * a.w,

            y: Math.random() * a.h,
          });
        }
      }
    },

    switchShape: function (n, fast) {
      var size,
        // 获取绘图区域

        a = S.Drawing.getArea();

      // 设置新形状的宽度和高度

      width = n.w;

      height = n.h;

      // 调整点的位置

      compensate();

      // 如果新形状的点数多于当前点数

      if (n.dots.length > dots.length) {
        // 计算需要添加的点数

        size = n.dots.length - dots.length;

        // 添加新的点

        for (var d = 1; d <= size; d++) {
          dots.push(new S.Dot(a.w / 2, a.h / 2));
        }
      }

      // 初始化索引变量

      var d = 0,
        i = 0;

      // 遍历新形状的点

      while (n.dots.length > 0) {
        // 随机选择一个索引

        i = Math.floor(Math.random() * n.dots.length);

        // 设置点的移动速度

        dots[d].e = fast ? 0.25 : dots[d].s ? 0.14 : 0.11;

        // 如果点已激活

        if (dots[d].s) {
          // 移动点到随机位置

          dots[d].move(
            new S.Point({
              z: Math.random() * 20 + 10,

              a: Math.random(),

              h: 18,
            })
          );
        } else {
          // 移动点到随机位置

          dots[d].move(
            new S.Point({
              z: Math.random() * 5 + 5,

              h: fast ? 18 : 30,
            })
          );
        }

        // 设置点为激活状态

        dots[d].s = true;

        // 移动点到新形状的对应位置

        dots[d].move(
          new S.Point({
            x: n.dots[i].x + cx,

            y: n.dots[i].y + cy,

            a: 1,

            z: 5,

            h: 0,
          })
        );

        // 从新形状的点列表中移除已处理的点

        n.dots = n.dots.slice(0, i).concat(n.dots.slice(i + 1));

        // 增加已处理的点数

        d++;
      }

      // 遍历剩余的点

      for (var i = d; i < dots.length; i++) {
        // 如果点已激活

        if (dots[i].s) {
          // 移动点到随机位置

          dots[i].move(
            new S.Point({
              z: Math.random() * 20 + 10,

              a: Math.random(),

              h: 20,
            })
          );

          // 设置点为未激活状态

          dots[i].s = false;

          // 设置点的移动速度

          dots[i].e = 0.04;

          // 移动点到随机位置

          dots[i].move(
            new S.Point({
              x: Math.random() * a.w,

              y: Math.random() * a.h,

              a: 0.3, //.4

              z: Math.random() * 4,

              h: 0,
            })
          );
        }
      }
    },

    // 渲染所有点

    render: function () {
      // 遍历所有点并调用其渲染方法

      for (var d = 0; d < dots.length; d++) {
        dots[d].render();
      }
    },
  };
})();

// 初始化S对象

S.init();
