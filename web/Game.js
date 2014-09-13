window.requestAnimationFrame = window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || window.oRequestAnimationFrame
    || function(callback) {
    setTimeout(callback, 1000 / 60);
};
//////////////////////////////////////////////////////////////
window.Game = {
    instanceOf:function(o,t){
        if(o && o.instanceOf && o.instanceOf(t)){
            return true;
        }
        return false;
    },
    isNumber:function(n){
        return typeof n == "number";
    },
    isString:function(s){
        return typeof s == "string";
    },
    isBool:function(b){
        return typeof b == "boolean";
    },
    isCanvas:function(c){
        return c instanceof HTMLElement && c.tagName.toUpperCase() == "CANVAS";
    },
    isDiv:function(d){
        return d instanceof HTMLElement && d.tagName.toUpperCase() == "DIV";
    },
    isiOS:function(){
        var userAgent = navigator.userAgent.toLowerCase();
        return userAgent.indexOf("iphone") >= 0 || userAgent.indexOf("ipad") >= 0;
    },
    isAndroid:function(){
        var userAgent = navigator.userAgent.toLowerCase();
        return userAgent.indexOf("android") >= 0;
    },
    addScore:function(value){
        var dom = this.getScoreDom();
        if(dom && this.isNumber(value) && value > 0){
            var score = parseInt(dom.innerHTML);
            score += value;
            dom.innerHTML = score;
        }
    },
    getCanvas:function(){
        return null;
    },
    getRenderer:function(){
        return null;
    },
    getSpriteFactory:function(){
        return null;
    },
    getWebSocketManager:function(){
        return null;
    },
    getScoreDom:function(){
        return;
    },
    getOperationDom:function(){
        return null;
    },
    isRunning:function(){
        return false;
    },

    getAwardCount:function(){
        return 0;
    },

    //获得一个道具
    receiveAward:function(){},

    //获得一个炸弹道具
    receiveBombAward:function(){
        this.receiveAward();
    },

    //使用一个炸弹道具
    useBombAward:function(){},

    //游戏结束
    gameOver:function(){},

    //重新开始
    restart:function(){},
    
    start:function(args){
        if(this.isRunning()){
            return;
        }
        var running = false;//标识是否处于运行状态
        this.isRunning = function(){return running;};
        var awardCount = 0;
        this.getAwardCount = function(){return awardCount;};
        this.receiveAward = function(){awardCount++;};
        args = args||{};
        var container = args.container;
        if(this.isDiv(container)){
            container.innerHTML = "";
            container.style.cssText += "position:relative;cursor:default;background-repeat:repeat";
            container.style.backgroundImage = "url(images/bg.gif)";

            //左下角
            var divLeftBottom = document.createElement("div");
            container.appendChild(divLeftBottom);
            divLeftBottom.style.cssText += "display:none;position:absolute;left:0px;bottom:0px;height:45px;"
            var bombImageDom = document.createElement("div");//炸弹图片
            divLeftBottom.appendChild(bombImageDom);
            bombImageDom.style.cssText += "float:left;width:42px;height:45px;background-repeat:no-repeat;";
            bombImageDom.style.backgroundImage = "url(images/bomb.gif)";
            var bombCountDom = document.createElement("div");//炸弹的数量
            divLeftBottom.appendChild(bombCountDom);
            bombCountDom.style.cssText += "float:left;height:100%;line-height:45px;margin-left:8px;";
            bombCountDom.innerHTML = "x 0";
            var bombAwardCount = 0;
            this.receiveBombAward = function(){
                this.receiveAward();
                bombAwardCount++;
                bombCountDom.innerHTML = "x "+bombAwardCount;
                divLeftBottom.style.display = "block";

            };
            this.useBombAward = function(){
                if(!aircraft.isCollide()){
                    if(bombAwardCount > 0){
                        bombAwardCount--;
                        var enemies = renderer.scene.getSpritesByType("Game.EnemyPlane");
                        while(enemies.length > 0){
                            var enemy = enemies[0];
                            enemy.explode();
                            enemies.splice(0,1);
                        }
                    }
                    if(bombAwardCount == 0){
                        divLeftBottom.style.display = "none";
                    }
                    bombCountDom.innerHTML = "x "+bombAwardCount;
                }
            };

            //创建canvas
            var canvas = document.createElement("canvas");
            canvas.style.cssText += "position:absolute;left:0px;top:0px;";
            this.getCanvas = function(){return canvas};
            canvas.style.cursor = "default";
            canvas.width = container.clientWidth > 0 ? container.clientWidth : 480;
            canvas.height = container.clientHeight > 0 ? container.clientHeight : 700;
            container.appendChild(canvas);

            //左上角
            var divLeftTop = document.createElement("div");
            divLeftTop.style.cssText += "position:absolute;left:15px;top:15px;height:30px;";
            container.appendChild(divLeftTop);
            var pauseDom = document.createElement("div");//暂停
            pauseDom.style.cssText += "float:left;width:29px;height:30px;background-repeat:no-repeat;"
            divLeftTop.appendChild(pauseDom);
            pauseDom.style.backgroundImage = "url(images/pause.png)";
            var scoreDom = document.createElement("div");//得分
            this.getScoreDom = function(){return scoreDom};
            scoreDom.innerHTML = "0";
            scoreDom.style.cssText += "float:left;height:100%;line-height:30px;margin-left:15px;font-weight:bold;";
            divLeftTop.appendChild(scoreDom);

            //创建单击暂停按钮后显示的继续、重新开始的dom节点
            var operationDom = document.createElement("div");
            var resumeDom = document.createElement("div");
            var restartDom = document.createElement("div");
            operationDom.style.display = "none";
            operationDom.style.cssText += "position:absolute;width:200px;z-index:1000;text-align: center;";
            operationDom.style.left = (canvas.width-200)/2+"px";
            operationDom.style.top = (canvas.height-72)/2+"px";
            container.appendChild(operationDom);
            operationDom.appendChild(resumeDom);
            operationDom.appendChild(restartDom);
            var a = "background-color:#D7DDDE;height:24px;line-height:24px;border:1px solid;";
            a+="-webkit-border-radius:12px;-moz-border-radius:12px;-o-border-radius:12px;-ms-border-radius:12px;border-radius:12px;"
            resumeDom.style.cssText += a;
            restartDom.style.cssText += a;
            restartDom.style.marginTop = "20px";
            resumeDom.innerHTML = "继续";
            restartDom.innerHTML = "重新开始";
            this.getOperationDom = function(){return operationDom;};

            //创建GameOver的dom节点
            var gameOverDom = document.createElement("div");
            container.appendChild(gameOverDom);
            gameOverDom.style.cssText += "display:none;position:absolute;width:280px;background-color:#D7DDDE;border:2px solid #515151;text-align:center;";
            gameOverDom.style.cssText += "-webkit-border-radius:10px;-moz-border-radius:10px;-o-border-radius:10px;-ms-border-radius:10px;border-radius:10px;";
            gameOverDom.style.left = (canvas.width-280)/2+"px";
            gameOverDom.style.top = (canvas.height-230)/2+"px";
            var labelDom = document.createElement("div");
            gameOverDom.appendChild(labelDom);
            labelDom.style.cssText += "height:50px;line-height:50px;border-bottom:2px solid #515151;";
            labelDom.innerHTML = "飞机大战分数";
            var lastScoreDom = document.createElement("div");
            gameOverDom.appendChild(lastScoreDom);
            lastScoreDom.style.cssText += "height:108px;line-height:108px;border-bottom:2px solid #515151;";
            lastScoreDom.innerHTML = "0";
            var restartContainerDom = document.createElement("div");
            gameOverDom.appendChild(restartContainerDom);
            restartContainerDom.style.cssText += "height:64px;overflow:hidden;";
            var restartDom2 = document.createElement("div");
            restartContainerDom.appendChild(restartDom2);
            restartDom2.style.cssText += "width:120px;height:32px;line-height:32px;margin:16px auto 0px auto;border:2px solid #515151;";
            restartDom2.style.cssText += "-webkit-border-radius:16px;-moz-border-radius:16px;-o-border-radius:16px;-ms-border-radius:16px;border-radius:16px;";
            restartDom2.innerHTML = "继续";
            this.gameOver = function(){
                lastScoreDom.innerHTML = scoreDom.innerHTML;
                awardCount = 0;
                bombAwardCount = 0;
                running = false;
                divLeftTop.style.display = "none";
                divLeftBottom.style.display = "none";
                operationDom.style.display = "none";
                gameOverDom.style.display = "block";
                //使用pause方法不能立即组织停止渲染，需要等1000/60毫秒后才可以
                renderer.pause();
                setTimeout(function(){
                    renderer.scene.clear();
                },100);
            };


            //初始化spriteFactory、renderer、aircraft
            var c2d = canvas.getContext('2d');
            var spriteFactory = Game.SpriteFactoryMaker(args);
            this.getSpriteFactory = function(){return spriteFactory};
            var renderer = Game.RendererMaker(c2d);
            this.getRenderer = function(){return renderer};
            var aircraft = spriteFactory.createCombatAircraft();
            aircraft.moveToCenterBottom(canvas);
            renderer.scene.add(aircraft);

            //暂停事件
            pauseDom.addEventListener("click",function(){
                if(running){
                    renderer.pause();
                    pauseDom.style.backgroundPosition = "-50px 0px";
                    operationDom.style.display = "block";
                    running = false;
                }
            },false);

            //继续事件
            resumeDom.addEventListener("click",function(){
                if(!running){
                    operationDom.style.display = "none";
                    pauseDom.style.backgroundPosition = "0px 0px";
                    renderer.run();
                    running = true;
                }
            },false);

            //重新开始
            this.restart = function(){
                awardCount = 0;
                bombAwardCount = 0;
                //重置左上角
                divLeftTop.style.display = "block";
                pauseDom.style.backgroundPosition = "0px 0px";
                scoreDom.innerHTML = "0";
                //隐藏暂停后出现的界面
                operationDom.style.display = "none";
                //重置左下角
                divLeftBottom.style.display = "none";
                bombCountDom.innerHTML = "x 0";
                //重置GameOver的界面
                gameOverDom.style.display = "none";
                lastScoreDom.innerHTML = "0";

                //使用pause方法不能立即组织停止渲染，需要等1000/60毫秒后才可以
                renderer.pause();
                setTimeout(function(){
                    renderer.scene.clear();
                    aircraft.moveToCenterBottom(canvas);
                    aircraft.setNotCollide();
                    renderer.scene.add(aircraft);
                    renderer.run();
                    running = true;
                },100);
            };

            //重新开始事件
            restartDom.addEventListener("click",Game.restart,false);
            restartDom2.addEventListener("click",Game.restart,false);

            var wsc = Game.WebSocketControlerMaker();
            this.getWebSocketManager = function(){return wsc;};
            renderer.run();
            running = true;
        }
    }
};
//基类
Game.BaseMaker = function(){
    var types = ["Game.Base"];
    var base = {
        instanceOf:function(t){
            for(var i= 0,length=types.length;i<length;i++){
                if(t == types[i]){
                    return true;
                }
            }
            return false;
        },
        addType:function(t){
            var b = this.instanceOf(t);
            if(!b){
                types.push(t);
            }
        }
    };
    return base;
};
//WebSocket控制器类
Game.WebSocketControlerMaker = function(){
    var url = "ws://"+location.hostname+":8888";
    var webSocket = null;
    var wsc = Game.BaseMaker();
    wsc.pause = function(){
        if(webSocket){
            //只有在websocket处于打开状态时才能发信息，如果处于connecting等状态则不可以
            if(webSocket.readyState == webSocket.OPEN){
                webSocket.send("running:false");
            }
        }
    };
    wsc.run = function(){
        if(webSocket){
            //只有在websocket处于打开状态时才能发信息，如果处于connecting等状态则不可以
            if(webSocket.readyState == webSocket.OPEN){
                webSocket.send("running:true");
            }
        }
    };
    document.body.onunload = function(){
        if(webSocket){
            webSocket.close();
        }
    };
    if(window.WebSocket){
        webSocket = new WebSocket(url);
        //一定要在页面关闭或刷新的时候关闭websockt，否则下次无法连接
        webSocket.onopen = function(){
            //只有在websocket处于打开状态时才能发信息，如果处于connecting等状态则不可以
            if(webSocket.readyState == webSocket.OPEN){
                var canvas = Game.getCanvas();
                if(canvas){
                    //发送宽度信息
                    var w = parseInt(canvas.width);
                    webSocket.send("width:"+w);
                }
            }
        };
//        webSocket.onerror = function(){
//            alert("连接失败");
//        };
        webSocket.onmessage = function(event){
            var str = event.data;
            var args = eval("("+str+")");
            console.log(args);
            var running = Game.isRunning();
            var renderer = Game.getRenderer();
            var spriteFactory = Game.getSpriteFactory();
            if(running && renderer && spriteFactory){
                var sprite = null;
                if(args.type == "SmallPlane"){
                    sprite = spriteFactory.createSmallEnemyPlane(args);
                }
                else if(args.type == "MiddlePlane"){
                    sprite = spriteFactory.createMiddleEnemyPlane(args);
                }
                else if(args.type == "BigPlane"){
                    sprite = spriteFactory.createBigEnemyPlane(args);
                }
                else if(args.type == "BombAward"){
                    sprite = spriteFactory.createBombAward(args);
                }
                else if(args.type == "BulletAward"){
                    sprite = spriteFactory.createBulletnAward(args);
                }
                if(sprite){
                    renderer.scene.add(sprite);
                }
            }
        };
        webSocket.onclose = function(){
            alert("连接关闭");
        };
    }
    return wsc;
};
//工厂类
Game.SpriteFactoryMaker = function(args){
    args = args||{};
    var combatAircraftMaterial = args.combatAircraftMaterial;
    var explosionMaterial = args.explosionMaterial;
    var yellowBulletMaterial = args.yellowBulletMaterial;
    var blueBulletMaterial = args.blueBulletMaterial;
    var smallEnemyPlaneMaterial = args.smallEnemyPlaneMaterial;
    var middleEnemyPlaneMaterial = args.middleEnemyPlaneMaterial;
    var bigEnemyPlaneMaterial = args.bigEnemyPlaneMaterial;
    var bombAwardMaterial = args.bombAwardMaterial;
    var bulletAwardMaterial = args.bulletAwardMaterial;

    var spriteFactory = Game.BaseMaker();
    spriteFactory.addType("Game.SpriteFactory");
    spriteFactory.createCombatAircraft = function(options){
        options = options||{};
        options.material = combatAircraftMaterial;
        return Game.CombatAircraftMaker(options);
    };
    spriteFactory.createExplosion = function(options){
        options = options||{};
        options.segment = 14;
        options.material = explosionMaterial;
        return Game.ExplosionMaker(options);
    };
    spriteFactory.createYellowBullet = function(options){
        options = options||{};
        options.material = yellowBulletMaterial;
        return Game.BulletMaker(options);
    };
    spriteFactory.createBlueBullet = function(options){
        options = options||{};
        options.material = blueBulletMaterial;
        return Game.BulletMaker(options);
    };
    spriteFactory.createSmallEnemyPlane = function(options){
        options = options||{};
        options.material = smallEnemyPlaneMaterial;
        return Game.SmallEnemyPlaneMaker(options);
    };
    spriteFactory.createMiddleEnemyPlane = function(options){
        options = options||{};
        options.material = middleEnemyPlaneMaterial;
        return Game.MiddleEnemyPlaneMaker(options);
    };
    spriteFactory.createBigEnemyPlane = function(options){
        options = options||{};
        options.material = bigEnemyPlaneMaterial;
        return Game.BigEnemyPlaneMaker(options);
    };
    spriteFactory.createBombAward = function(options){
        options = options||{};
        options.material = bombAwardMaterial;
        return Game.BombAwardMaker(options);
    };
    spriteFactory.createBulletnAward = function(options){
        options = options||{};
        options.material = bulletAwardMaterial;
        return Game.BulletAwardMaker(options);
    };

    return spriteFactory;
};
//事件类
Game.EventManagerMaker = function(args){
    args = args||{};
    var canvas = Game.isCanvas(args.canvas) ? args.canvas : null;
    var scene = Game.instanceOf(args.scene,"Game.Scene") ? args.scene : null;
    var down=false,previousX=-1,previousY=-1;
    var oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear()-100);

    var lastDate = oldDate;
    var startDate = oldDate;
    var endDate = oldDate;
    var eventManager = Game.BaseMaker();
    eventManager.addType("Game.EventManager");

    //PC事件
    function onMouseDown(event){
        event.preventDefault();
        if(Game.isRunning()){
            previousX = event.layerX||event.offsetX;
            previousY = event.layerY||event.offsetY;
            down = true;
        }
    }
    //PC事件
    function onMouseMove(event){
        event.preventDefault();
        if(down && Game.isRunning()){
            var myPlane = scene.getCombatAircraft();
            if(myPlane){
                var collide = myPlane.isCollide();
                if(!collide){
                    var x = event.layerX||event.offsetX;
                    var y = event.layerY||event.offsetY;
                    myPlane.move(x-previousX,y-previousY);
                    previousX = x;
                    previousY = y;
                }
            }
        }
    }
    //PC事件
    function onMouseUp(event){
        event.preventDefault();
        if(Game.isRunning()){
            down = false;
            previousX = -1;
            previousY = -1;
        }
    }
    //PC事件
    function onDblClick(event){
        Game.useBombAward();
    }

    //Mobile事件
    function onTouchStart(event){
        //要屏蔽掉preventDefault，否则不能响应移动端onclick
        //event.preventDefault();
        if(Game.isRunning()){
            if(event.targetTouches.length > 0){
                var touch = event.targetTouches[0];
                previousX = touch.pageX;
                previousY = touch.pageY;
                down = true;
            }
        }

        startDate = new Date();
        //alert("onTouchStart");
    }

    //Mobile事件
    function onTouchMove(event){
        //要执行preventDefault，否则在iPhone上面会拖拽页面
        event.preventDefault();
        if(down && Game.isRunning()){
            if(event.targetTouches.length > 0){
                var myPlane = scene.getCombatAircraft();
                if(myPlane){
                    var collide = myPlane.isCollide();
                    if(!collide){
                        var touch = event.targetTouches[0];
                        var x = touch.pageX;
                        var y = touch.pageY;
                        myPlane.move(x-previousX,y-previousY);
                        previousX = x;
                        previousY = y;
                    }
                }
            }
        }
    }

    //Mobile事件
    //用touchstart和touchend模拟双击事件
    function onTouchEnd(event){
        //要屏蔽掉preventDefault，否则不能响应移动端onclick
        //event.preventDefault();
        if(Game.isRunning()){
            down = false;
            previousX = -1;
            previousY = -1;
        }

        endDate = new Date();
        var endTime = endDate.getTime();
        var startTime = startDate.getTime();
        var time = endTime-startTime;
        //此处的200表示的是一次单击事件所需要的时间
        if(time <= 200){
            var time2 = endTime-lastDate.getTime();
            //此处的300表示的是一次双击事件中的两次单击事件相隔的时间
            if(time2 < 300){
                //alert("双击,time:"+time+",time2:"+time2);
                Game.useBombAward();
                lastDate = oldDate;
            }
            else{
                lastDate = endDate;
            }
        }
    }

    if(canvas && scene){
        //添加PC端事件
        document.body.addEventListener("mousedown",onMouseDown,false);
        canvas.addEventListener("mousemove",onMouseMove,false);
        document.body.addEventListener("mouseup",onMouseUp,false);
        canvas.addEventListener("dblclick",onDblClick,false);

        //添加移动端事件
        canvas.addEventListener("touchstart",onTouchStart,false);
        canvas.addEventListener("touchmove",onTouchMove,false);
        canvas.addEventListener("touchend",onTouchEnd,false);
    }
    return eventManager;
};
//场景类
Game.SceneMaker = function(c2d){
    //先画自己的战斗机
    var sprites = [];
    var aircraft = null;
    var context2d = c2d instanceof CanvasRenderingContext2D ? c2d : null;
    var drawTime = 0;
    var scene = Game.BaseMaker();
    scene.addType("Game.Scene");
    scene.getSprites = function(){
        return sprites;
    };
    scene.getCombatAircraft = function(){
        return aircraft;
    };
    scene.add = function(s){
        if(Game.instanceOf(s,"Game.CombatAircraft")){
            if(aircraft){
                return false;
            }
            else{
                sprites.push(s);
                s.setScene(this);
                aircraft = s;
                return true;
            }
        }
        else if(Game.instanceOf(s,"Game.Sprite")){
            sprites.push(s);
            s.setScene(this);
            return true;
        }
        return false;
    };
    scene.remove = function(s){
        if(Game.instanceOf(s,"Game.Sprite")){
            for(var i= 0,length = sprites.length;i<length;i++){
                var si = sprites[i];
                if(s == si){
                    sprites.splice(i,1);
                    if(s == aircraft){
                        aircraft = null;
                    }
                    return true;
                }
            }
        }
        return false;
    };
    scene.getSpritesByType = function(type){
        var result = [];
        if(Game.isString(type)){
            for(var i = 0,length = sprites.length;i<length;i++){
                var s = sprites[i];
                if(Game.instanceOf(s,type)){
                    result.push(s);
                }
            }
        }
        return result;
    };
    scene.clear = function(){
        while(sprites.length > 0){
            var s = sprites[0];
            s.destroy();
        }
        sprites = [];
        aircraft = null;
        if(context2d){
            var c = context2d.canvas;
            context2d.clearRect(0,0, c.width, c.height);
        }
    };
    scene.beforeDraw = function(){
        //检查战斗机跑到子弹前面的情况
        if(aircraft){
            var aircraftY = aircraft.getY();
            var bullets = this.getSpritesByType("Game.Bullet");
            while(bullets.length > 0){
                var bullet = bullets[0];
                var bulletY = bullet.getY();
                if(aircraftY <= bulletY){
                    bullet.destroy();
                }
                bullets.splice(0,1);
            }
        }
    };
    scene.draw = function(){
        drawTime++;
        this.beforeDraw();
        if(context2d instanceof CanvasRenderingContext2D){
            context2d.clearRect(0,0,context2d.canvas.width,context2d.canvas.height);
            var copySprites = [];
            for(var i = 0,length = sprites.length;i<length;i++){
                copySprites.push(sprites[i]);
            }
            while(copySprites.length > 0){
                var sprite = copySprites[0];
                sprite.draw(context2d);
                copySprites.splice(0,1);
            }
        }
        this.afterDraw();
    },
    //在一帧绘制完成后执行
    scene.afterDraw = function(){};
    return scene;
};
//渲染器类
Game.RendererMaker = function(c2d){
    var context2d = c2d instanceof CanvasRenderingContext2D ? c2d : null;
    var running = false;
    var eventManager = null;
    var renderer = Game.BaseMaker();
    renderer.addType("Game.Renderer");
    renderer.scene = Game.SceneMaker(context2d);
    if(context2d && context2d.canvas){
        eventManager = Game.EventManagerMaker({
            canvas:context2d.canvas,
            scene:renderer.scene
        });
    }
    function render(){
        if(context2d && running){
           renderer.scene.draw(context2d);
           window.requestAnimationFrame(tick);
        }
    };
    function tick(){
        if(running){
            render.apply(renderer,arguments);
        }
    };
    renderer.run = function(){
        if(!running && context2d){
            running = true;
            tick();
        }
        var wsm = Game.getWebSocketManager();
        if(wsm){
            wsm.run();
        }
    };
    //使用pause方法不能立即组织停止渲染，需要等1000/60毫秒后才可以
    renderer.pause = function(){
        running = false;
        var wsm = Game.getWebSocketManager();
        if(wsm){
            wsm.pause();
        }
    };

    return renderer;
};

//精灵类，所有绘图对象的基类
Game.SpriteMaker = function(args){
    args = args||{};
    var context2d = null;
    var scene = null;
    var visible = Game.isBool(args.visible) ? args.visible : true;
    var x = Game.isNumber(args.x) ? args.x : 0;
    var y = Game.isNumber(args.y) ? args.y : 0;
    var collideOffset = Game.isNumber(args.collideOffset) && args.collideOffset >= 0 ? args.collideOffset : 0;
    var material = args.material instanceof Image && args.material.width > 0 && args.material.height > 0 ? args.material : null;
    var drawTime = 0;
    var sprite = Game.BaseMaker();
    sprite.addType("Game.Sprite");
    sprite.getContext2d = function(){
        return context2d;
    };
    sprite.setScene = function(s){
        if(Game.instanceOf(s,"Game.Scene")){
            scene = s;
        }
    };
    sprite.getScene = function(){
        return scene;
    };
    sprite.setVisibility = function(b){
        if(Game.isBool(b)){
            visible = b;
        }
    };
    sprite.getVisibility = function(){
        return visible;
    };
    sprite.setX = function(a){
        if(Game.isNumber(a)){
            x = a;
        }
    };
    sprite.getX = function(){
        return x;
    };
    sprite.setY = function(b){
        if(Game.isNumber(b)){
            y = b;
        }
    };
    sprite.getCollideOffset = function(){
        return collideOffset;
    };
    sprite.getY = function(){
        return y;
    };
    sprite.getMaterial = function(){
        return material;
    };
    sprite.getDrawTime = function(){
        return drawTime;
    };
    sprite.width = function(){
        if(material){
            return material.width;
        }
        return 0;
    };
    sprite.height = function(){
        if(material){
            return material.height;
        }
        return 0;
    };
    sprite.move = function(a,b){
        if(Game.isNumber(a) && Game.isNumber(b)){
            x+=a;
            y+=b;
        }
    };
    sprite.moveTo = function(a,b){
        if(Game.isNumber(a) && Game.isNumber(b)){
            x = a;
            y = b;
        }
    };
    sprite.centerTo = function(a,b){
        if(Game.isNumber(a) && Game.isNumber(b)){
            var w = this.width();
            var h = this.height();
            x = a - w/2;
            y = b - h/2;
        }
    };
    sprite.getCollidePointWithOther = function(s){
        var p = null;
        if(Game.instanceOf(s,"Game.Sprite")){
            var sMinX = s.getX();
            var sMaxX = sMinX + s.width();
            var sMinY = s.getY();
            var sMaxY = sMinY + s.height();
            var sCollideOffset = s.getCollideOffset();
            sMinX += sCollideOffset;
            sMaxX -= sCollideOffset;
            sMinY += sCollideOffset;
            sMaxY -= sCollideOffset;

            var thisMinX = this.getX();
            var thisMaxX = thisMinX + this.width();
            var thisMinY = this.getY();
            var thisMaxY = thisMinY + this.height();
            thisMinX += collideOffset;
            thisMaxX -= collideOffset;
            thisMinY += collideOffset;
            thisMaxY -= collideOffset;

            var isMergeX = !(thisMaxX <= sMinX || sMaxX <= thisMinX);
            var isMergeY = !(thisMaxY <= sMinY || sMaxY <= thisMinY);
            if(isMergeX && isMergeY){
                p = {};
                var sortNumber = function(a,b){var c = a-b;return c;};
                var xArray = [thisMinX,thisMaxX,sMinX,sMaxX];
                var yArray = [thisMinY,thisMaxY,sMinY,sMaxY];
                xArray.sort(sortNumber);
                yArray.sort(sortNumber);
                p.x = (xArray[1]+xArray[2])/2;
                p.y = (yArray[1]+yArray[2])/2;
            }
        }
        return p;
    };
    sprite.beforeDraw = function(c2d){};
    sprite.draw = function(c2d){
        drawTime++;
        this.beforeDraw(c2d);
        if(material && c2d instanceof CanvasRenderingContext2D && visible){
            context2d = c2d;
            context2d.drawImage(material,x,y,material.width,material.height);
        }
        this.afterDraw(c2d);
    };
    sprite.afterDraw = function(c2d){};
    sprite.beforeDestroy = function(){};
    sprite.destroy = function(){
        this.beforeDestroy();
        if(Game.instanceOf(scene,"Game.Scene")){
            var b = scene.remove(this);
            if(b){
                scene = null;
                this.afterDestroy();
            }
            return b;
        }
        return false;
    };
    sprite.afterDestroy = function(){};
    return sprite;
};

//自动飞行类
Game.AutoSpriteMaker = function(args){
    args = args||{};
    //每帧移动的像素数,以向下为正
    var speed = Game.isNumber(args.speed) ? args.speed : 2;
    var autoSprite = Game.SpriteMaker(args);
    autoSprite.addType("Game.AutoSprite");
    var spriteBeforeDraw = autoSprite.beforeDraw;
    var spriteAfterDraw = autoSprite.afterDraw;
    autoSprite.getSpeed = function(){
        return speed;
    };
    autoSprite.setSpeed = function(v){
        if(Game.isNumber(v)){
            speed = v;
        }
    };
    autoSprite.beforeDraw = function(c2d){
        spriteBeforeDraw.apply(this,arguments);
        this.move(0,speed);
    };
    //返回值表示子类继承调用的时候后面的方法是否还需执行
    autoSprite.afterDraw = function(c2d){
        spriteAfterDraw.apply(this,arguments);
        //判断是否完全在canvas之外
        var c = c2d.canvas;
        var W = c.width;
        var H = c.height;
        var x = this.getX();
        var y = this.getY();
        var w = this.width();
        var h = this.height();
        var isOut = x+w<=0 || x>=W || y+h<=0 || y>=H;
        if(isOut){
            this.destroy();
            return false;
        }
        return true;
    };
    return autoSprite;
};
//道具奖品类
Game.AwardMaker = function(args){
    args = args||{};
    args.speed = 7;
    var status = "DOWN1";//DOWN1、UP2、DOWN3
    var award = Game.AutoSpriteMaker(args);
    award.addType("Game.Award");
    var autoSpriteAfterDraw = award.afterDraw;
    //绘制完成后要判断是否要改变方向和速度
    award.afterDraw = function(c2d){
        var b = autoSpriteAfterDraw.apply(this,arguments);
        //在绘制一定次数后要改变方向
        if(b != false){
            if(status != "DOWN3"){
                var H = c2d.canvas.height;
                var y = this.getY();
                var maxY = y + this.height();
                if(status == "DOWN1"){
                    //第一次向下
                    if(maxY >= H*0.25){
                        //当第一次下降到临界值时改变方向，向上
                        this.setSpeed(-5);
                        status = "UP2";
                    }
                }
                else if(status == "UP2"){
                    //第二次向上
                    if(maxY+this.getSpeed() <= 0){
                        //第二次上升到临界值时改变方向，向下
                        this.setSpeed(13);
                        status = "DOWN3";
                    }
                }
            }
        }
    };
    return award;
};
//炸弹道具
Game.BombAwardMaker = function(args){
    args = args||{};
    var bombAward = Game.AwardMaker(args);
    bombAward.addType("Game.BombAward");
    return bombAward;
};
//子弹道具类
Game.BulletAwardMaker = function(args){
    args = args||{};
    var bulletAward = Game.AwardMaker(args);
    bulletAward.addType("Game.BulletAward");
    return bulletAward;
};
//子弹类
Game.BulletMaker = function(args){
    args = args||{};
    args.down = false;
    args.speed = -10;//负数表示子弹向上飞
    var bullet = Game.AutoSpriteMaker(args);
    bullet.addType("Game.Bullet");
    return bullet;
};

//敌人的飞机
Game.EnemyPlaneMaker = function(args){
    args = args||{};
    args.down = true;
    var power = 1;
    var value = 0;
    if(Game.isNumber(args.power)){
        var n = Math.floor(args.power);
        if(n > 0){
            power = n;
        }
    }
    if(Game.isNumber(args.value)){
        var v = Math.floor(args.value);
        if(v > 0){
            value = v;
        }
    }

    var enemyPlane = Game.AutoSpriteMaker(args);
    enemyPlane.addType("Game.EnemyPlane");
    var autoSpriteAfterDraw = enemyPlane.afterDraw;
    //绘制完成后要检查自身是否被子弹打中
    enemyPlane.afterDraw = function(c2d){
        autoSpriteAfterDraw.apply(this,arguments);
        var scene = this.getScene();
        if(scene){
            //敌机在绘制完成后要判断是否被子弹打中
            var p = null;
            var bullets = scene.getSpritesByType("Game.Bullet");
            while(bullets.length > 0){
                var bullet = bullets[0];
                p = this.getCollidePointWithOther(bullet);
                if(p){
                    //子弹打到了飞机上
                    bullet.destroy();
                    power--;
                    if(power <= 0){
                        this.explode();
                        return;
                    }
                }
                bullets.splice(0,1);
            }
        }
    };
    //自身爆炸
    enemyPlane.explode = function(){
        Game.addScore(value);
        var scene = this.getScene();
        var spriteFactory = Game.getSpriteFactory();
        if(scene && spriteFactory){
            var options = {
                segment:14,
                centerX:this.getX()+this.width()/2,
                centerY:this.getY()+this.height()/2
            };
            scene.add(spriteFactory.createExplosion(options));
        }
        this.destroy();
    };

    return enemyPlane;
};

//小敌机
Game.SmallEnemyPlaneMaker = function(args){
    args = args||{};
    args.power = 1;
    args.value = 1000;
    var smallPlane = Game.EnemyPlaneMaker(args);
    smallPlane.addType("Game.SmallEnemyPlane");
    return smallPlane;
};

//中敌机
Game.MiddleEnemyPlaneMaker = function(args){
    args = args||{};
    args.power = 4;
    args.value = 6000;
    var middlePlane = Game.EnemyPlaneMaker(args);
    middlePlane.addType("Game.MiddleEnemyPlane");
    return middlePlane;
};

//大敌机
Game.BigEnemyPlaneMaker = function(args){
    args = args||{};
    args.power = 10;
    args.value = 30000;
    var bigPlane = Game.EnemyPlaneMaker(args);
    bigPlane.addType("Game.BigEnemyPlane");
    return bigPlane;
};

//自己的战斗机
Game.CombatAircraftMaker = function(args){
    args = args||{};
    args.collideOffset = 20;
    var collide = false;//标识战斗机是否被击中
    var bombAwardCount = 0;//可使用的炸弹数
    var bulletInfo = {
        single:true,//标识是否发的是单一的子弹
        doubleTime:0,//当前已经用双子弹绘制的次数
        maxDoubleTime:140//使用双子弹最多绘制的次数
    };
    var flushInfo = {
        isFlush:false,//是否由于被撞处于闪烁状态，闪烁一定次数后destroy
        isBeginFlush:false,
        drawTime:0,
        beginDrawTime:0,
        flushTime:0,//闪烁的次数
        flushFrequency:16,//每次闪烁占据绘制30帧的时间
        maxFlushTime:10//最大闪烁次数
    };
    var aircraft = Game.SpriteMaker(args);
    aircraft.addType("Game.CombatAircraft");
    var spriteMove = aircraft.move;
    var spriteMoveTo = aircraft.moveTo;
    var spriteCenterTo = aircraft.centerTo;
    var spriteBeforeDraw = aircraft.beforeDraw;
    var spriteAfterDraw = aircraft.afterDraw;
    var spriteBeforeDestroy = aircraft.beforeDestroy;
    aircraft.isCollide = function(){
        return collide;
    };
    aircraft.setNotCollide = function(){collide = false;};
    //确保战斗机不会飞出Canvas
    aircraft.makePositionValid = function(){
        var x = this.getX();
        var y = this.getY();
        if(x < 0){
            x = 0;
        }

        if(y < 0){
            y = 0;
        }

        var context2d = this.getContext2d();
        if(context2d){
            var c = context2d.canvas;
            var maxX = x + this.width();
            var maxY = y + this.height();
            if(maxX > c.width){
                x = c.width - this.width();
            }
            if(maxY > c.height){
                y = c.height - this.height();
            }
        }
        this.setX(x);
        this.setY(y);
    };
    aircraft.move = function(a,b){
        spriteMove.apply(this,arguments);
        this.makePositionValid();
    };
    aircraft.moveTo = function(a,b){
        spriteMoveTo.apply(this,arguments);
        this.makePositionValid();
    };
    aircraft.centerTo = function(a,b){
        spriteCenterTo.apply(this,arguments);
        this.makePositionValid();
    };
    aircraft.moveToCenterBottom = function(canvas){
        if(Game.isCanvas(canvas)){
            var x = canvas.width/2-this.width()/2;
            var y = canvas.height-this.height();
            this.moveTo(x,y);
        }
    };
    aircraft.beforeDraw = function(c2d){
        if(!collide){
            spriteBeforeDraw.apply(this,arguments);
            var drawTime = this.getDrawTime();
            //每隔一定时间发射一枚炮弹
            if(drawTime % 7 == 0){
                this.fight();
            }
        }
    };
    aircraft.afterDraw = function(c2d){
        spriteAfterDraw.apply(this,arguments);
        var scene = this.getScene();
        var p = null;
        //在飞机当前还没有被击中时，要判断是否将要被敌机击中
        if(!collide){
            var enemies = scene.getSpritesByType("Game.EnemyPlane");
            while(enemies.length > 0){
                var enemy = enemies[0];
                p = this.getCollidePointWithOther(enemy);
                if(p){
                    this.explode();
                    break;
                }
                enemies.splice(0,1);
            }
        }

        //被击中之后进行闪烁
        if(flushInfo.isFlush){
            flushInfo.drawTime++;
            if(flushInfo.drawTime == flushInfo.beginDrawTime){
                this.setVisibility(true);
                flushInfo.isBeginFlush = true;
            }
            if(flushInfo.isBeginFlush){
                if(flushInfo.drawTime%flushInfo.flushFrequency == 0){
                    var visible = this.getVisibility();
                    this.setVisibility(!visible);
                    flushInfo.flushTime++;
                    if(flushInfo.flushTime >= flushInfo.maxFlushTime){
                        this.destroy();
                        Game.gameOver();
                    }
                }
            }
        }

        //在没有被击中的情况下检查是否获得了道具
        if(!collide){
            //检查是否获得炸弹道具
            var bombAwards = scene.getSpritesByType("Game.BombAward");
            while(bombAwards.length > 0){
                var bombAward = bombAwards[0];
                p = this.getCollidePointWithOther(bombAward);
                if(p){
                    bombAwardCount++;
                    bombAward.destroy();
                    Game.receiveBombAward();
                    //this.bomb();
                }
                bombAwards.splice(0,1);
            }

            //检查是否获得子弹道具
            var bulletAwards = scene.getSpritesByType("Game.BulletAward");
            while(bulletAwards.length > 0){
                var bulletAward = bulletAwards[0];
                p = this.getCollidePointWithOther(bulletAward);
                if(p){
                    bulletAward.destroy();
                    bulletInfo.single = false;
                    bulletInfo.doubleTime = 0;
                }
                bulletAwards.splice(0,1);
            }
        }
    };
    aircraft.beforeDestroy = function(){
        var b = spriteBeforeDestroy.apply(this,arguments);
        if(b != false){
            //重置flushInfo信息
            flushInfo = {
                isFlush:false,//是否由于被撞处于闪烁状态，闪烁一定次数后destroy
                isBeginFlush:false,
                drawTime:0,
                beginDrawTime:0,
                flushTime:0,//闪烁的次数
                flushFrequency:16,//每次闪烁占据绘制30帧的时间
                maxFlushTime:10//最大闪烁次数
            };
            //重置bulletInfo信息
            bulletInfo = {
                single:true,
                doubleTime:0,//当前已经用双子弹绘制的次数
                maxDoubleTime:600//使用双子弹最多绘制的次数，相当于10s
            };
        }
    };
    //自身爆炸
    aircraft.explode = function(){
        if(!collide){
            collide = true;
            var scene = this.getScene();
            var spriteFactory = Game.getSpriteFactory();
            if(scene && spriteFactory){
                this.setVisibility(false);
                var options = {centerX:this.getX()+this.width()/2,centerY:this.getY()+this.height()/2};
                var explosion = spriteFactory.createExplosion(options);
                scene.add(explosion);
                flushInfo.beginDrawTime = explosion.getExplodeFrame();
                flushInfo.isFlush = true;
            }
        }
    };
    //开火
    aircraft.fight = function(){
        var scene = this.getScene();
        var spriteFactory = Game.getSpriteFactory();
        if(scene && spriteFactory){
            var x = this.getX()+this.width()/2;
            var y = this.getY()-5;
            if(bulletInfo.single){
                scene.add(spriteFactory.createYellowBullet({x:x,y:y}));
            }
            else{
                var offset = this.width()/4;
                var leftX = x - offset;
                var rightX = x + offset;
                scene.add(spriteFactory.createBlueBullet({x:leftX,y:y}));
                scene.add(spriteFactory.createBlueBullet({x:rightX,y:y}));
                bulletInfo.doubleTime++;
                if(bulletInfo.doubleTime >= bulletInfo.maxDoubleTime){
                    bulletInfo.single = true;
                    bulletInfo.doubleTime = 0;
                }
            }
        }
    };
    //扔出炸弹
    aircraft.bomb = function(){
        if(bombAwardCount > 0){
            var scene = this.getScene();
            if(scene){
                var enemies = scene.getSpritesByType("Game.EnemyPlane");
                while(enemies.length > 0){
                    var enemy = enemies[0];
                    enemy.explode();
                    enemies.splice(0,1);
                }
            }
            bombAwardCount--;
        }
    };
    return aircraft;
};

//爆炸类，需要传入centerX、centerY、segment信息
Game.ExplosionMaker = function(args){
    args = args||{};
    var width = 50,height = 50;
    var level = 0;
    var explodeFrequency = 2;
    var segment = Game.isNumber(args.segment) && Math.floor(args.segment) >= 1 ? Math.floor(args.segment) : 1;
    var centerX = Game.isNumber(args.centerX) ? args.centerX : 0;
    var centerY = Game.isNumber(args.centerY) ? args.centerY : 0;
    var drawTime = 0;
    var context2d = null;
    var material = args.material instanceof Image && args.material.width > 0 && args.material.height > 0 ? args.material : null;
    if(material){
        width = material.width / segment;
        height = material.height;
    }
    var x = centerX - width/2;
    var y = centerY - height/2;
    args.x = x;
    args.y = y;
    var explosion = Game.SpriteMaker(args);
    explosion.addType("Game.Explosion");
    explosion.width = function(){
        return width;
    };
    explosion.height = function(){
        return height;
    };
    explosion.getDrawTime = function(){
        return drawTime;
    };
    explosion.draw = function(c2d){
        drawTime++;
        this.beforeDraw(c2d);
        if(material && c2d instanceof CanvasRenderingContext2D && this.getVisibility()){
            context2d = c2d;
            var sx = width * level;
            var sy = 0;
            var sw = width;
            var sh = height;
            var dx = x;
            var dy = y;
            var dw = width;
            var dh = height;
            context2d.drawImage(material,sx,sy,sw,sh,dx,dy,dw,dh);
        }
        this.afterDraw(c2d);
    };
    explosion.afterDraw = function(c2d){
        if(drawTime%explodeFrequency == 0){
            level++;
            if(level >= segment){
                this.destroy();
            }
        }
    };
    explosion.getExplodeFrame = function(){
        return segment*explodeFrequency;
    };
    return explosion;
};