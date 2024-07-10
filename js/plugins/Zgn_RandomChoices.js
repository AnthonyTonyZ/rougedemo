/*:zh
 * @plugindesc 自定义选择
 * @author zgn
 * @help
 *
 * @param ---选项信息---
 *
 * @param 数量
 * @parent ---选项信息---
 * @desc 选项数量,可供选择的buff数要多于这个,不然会报错
 * @default 4
 *
 * @param 光环数量
 * @parent ---选项信息---
 * @desc 选项数量
 * @default 5
 *
 * @param ---文本管理---
 *
 * @param 确认弹窗OK
 * @parent ---文本管理---
 * @desc OK文本
 * @default 确认
 *
 * @param 确认弹窗Cancel
 * @parent ---文本管理---
 * @desc Cancel文本
 * @default 取消
 *
 * @help
 * ============================================================================
 * 介绍
 * ============================================================================
 *
 * 状态名格式 rc_'name'_'version' demo:rc_物理克制_3
 */

// 业务对象
var Zgn = Zgn || {};
Zgn.RanCho = {};
Zgn.RanCho.version = 1.37;
//停留页面
Zgn.RanCho.activeWin = 0;//0:无;1:Window_Random_Choices;2:Window_RandomChoicesConfirm
//已选状态记录
Zgn.RanCho.GainStateIdRef = [];
Zgn.RanCho.GainStateNow = {};
Zgn.RanCho.gqNow = 1;//当前关卡,从1开始
Zgn.RanCho.gh_sl_now = 0;//光环实际数量

//获取插件配置
var parameters = PluginManager.parameters('Zgn_RandomChoices');
Zgn.RanCho.xz_sl = String(parameters['数量']);
Zgn.RanCho.gh_sl = String(parameters['光环数量']);
Zgn.RanCho.confirmOKTxt = String(parameters['确认弹窗OK']);
Zgn.RanCho.confirmCanTxt = String(parameters['确认弹窗Cancel']);
// console.log("获取的文本",Zgn.RanCho.confirmOKTxt,Zgn.RanCho.confirmCanTxt)
// Zgn.RanCho.test = String(parameters['Show Turns']);
// Number(parameters['num']);

//获取rpg数据库信息
Zgn.RanCho.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function () {
    //保证数据库被加载_不明觉厉
    if (!Zgn.RanCho.DataManager_isDatabaseLoaded.call(this)) return false;
    if (!Zgn._loaded_ZGN_BuffsStatesCore) {
        this.processRCNotetags($dataStates);
        Zgn._loaded_ZGN_BuffsStatesCore = true;
    }
    return true;
};

/**
 * @description 从数据中提取不同的数据结构
 * @param group {$dataStates} rpg的DataManager中的状态数据
 * @return void
 * @author zgn
 */
DataManager.processRCNotetags = function (group) {
    if (Zgn.RanCho.StateIdRef) return;
    //所有状态
    Zgn.RanCho.StateIdRef = [];//所有状态选项
    Zgn.RanCho.StateNameRef = [];//选项池数据
    // Zgn.RanCho.StateNameRefNow =[];//当前选项池
    // console.log("自定义脚本获取parameters",parameters)
    // console.log("自定义脚本获取xz_sl_4,test[英文参数]",Zgn.RanCho.xz_sl,Zgn.RanCho.test)
    for (var n = 1; n < group.length; n++) {
        var obj = group[n];
        // console.log("自定义脚本获取$dataStates",obj)
        if (obj.name.startsWith('rc_')) {
            // console.log("$dataStates详细数据",obj)
            var nameInfo = obj.name.split("_");
            Zgn.RanCho.StateIdRef.push({
                'id': obj.id,
                'name': nameInfo[1],
                'enabled': true,
                'desc': obj.message3,//状态持续时
                'version': nameInfo[2]
            });

            let found = false;
            for (let i = 0; i < Zgn.RanCho.StateNameRef.length; i++) {
                let state = Zgn.RanCho.StateNameRef[i];
                if (state.name == nameInfo[1]) {
                    state.maxversion += 1
                    found = true;
                    break;
                }

            }

            if (!found) {
                Zgn.RanCho.StateNameRef.push({
                    'name': nameInfo[1],
                    'maxversion': 1,
                    'minversion': 1
                });
            }
        }

    }
    // console.log('processRCNotetags',Zgn.RanCho.StateIdRef,'选项池',Zgn.RanCho.StateNameRef)
};


/**
 * @description 获取随机状态选项
 * @param statesObj {Zgn.RanCho.StateNameRef} rpg的DataManager中的'状态'针对RC处理后的数据
 * @param count {Number} 每次有几个选项
 * @return {Zgn.RanCho.StateIdRef} 同类型数据结构(选择后)
 * @author zgn
 */
function getRandomStates(statesObj, count) {
    console.log('processRCNotetags', Zgn.RanCho.StateIdRef, '选项池', Zgn.RanCho.StateNameRef)
    if (statesObj.length < count) {
        console.log("可供选择的buff数不足")
    }
    // console.log("是否进入新方法")
    //1.statesObj-随机选择
    const availableStates = statesObj.concat();

    const randomStates = [];
    while (randomStates.length < count) {
        // 从可用的状态中随机选择一个
        const randomIndex = Math.floor(Math.random() * availableStates.length);
        const randomState = availableStates[randomIndex];

        // 添加到结果和最近选择中
        randomStates.push(randomState);

        // 从可用状态中移除已选择的状态
        availableStates.splice(randomIndex, 1);
    }

    // console.log("报错1")

    //2.组合StateIdRef数据类型
    const randomStatesForResult = []
    for (let i = 0; i < randomStates.length; i++) {
        let state2 = randomStates[i];
        // console.log("复杂度i:",i,state2,'//////')
        for (let j = 0; j < Zgn.RanCho.StateIdRef.length; j++) {
            let state = Zgn.RanCho.StateIdRef[j];
            // console.log("复杂度j:",j,state,'\\\\')
            if (state.name == state2.name &&
                state.version == state2.minversion) {
                randomStatesForResult.push(state)
                // console.log("break,退出当前循环")
                // break;
                if (randomStatesForResult.length == count) {
                    // console.log("新版数据",randomStatesForResult)
                    return randomStatesForResult;
                    ;
                }
            }
        }

    }

    // 返回包含状态名称的数组，或者你可以根据需要返回状态值和名称的键值对

}

/*// 示例使用
const states = {
    "无法战斗": 1, "防御": 2, "不死之身": 3, "中毒": 4, "黑暗": 5,
    "沉默": 6, "愤怒": 7, "混乱": 8, "魅惑": 9, "睡眠": 10
};

// 第一次选择
const firstChoices = getRandomStates(states, Zgn.RanCho.xz_sl);
console.log(firstChoices);

// 第二次选择（此时不能选择第一次选择过的状态）
const secondChoices = getRandomStates(Zgn.RanCho.StateIdRef, Zgn.RanCho.xz_sl, firstChoices.map(obj => Object.keys(obj)[0]));
console.log(secondChoices);

// 第三次选择（此时可以重新选择第一次的状态，但不能选择第二次的状态）
const thirdChoices = getRandomStates(Zgn.RanCho.StateIdRef, Zgn.RanCho.xz_sl, secondChoices.map(obj => Object.keys(obj)[0]));
console.log(thirdChoices);

//脚本可以调用本方法
var test_fun = function(s){
    $gameMessage.add(s);
}
*/

/**
 * @description 低于[最大光环数]弹窗获取随机'状态'
 * @param count {Number} 随机数
 * @param max {Number} 最多光环次数
 * @return void
 * @author zgn
 */
function getRandomStatesForMV(count, max) {
    Zgn.RanCho.xz_sl_now = count || Zgn.RanCho.xz_sl;
    Zgn.RanCho.gh_sl_max = max || Zgn.RanCho.gh_sl

    // console.log("getRandomStatesForMV随机数3:",result,count,Zgn.RanCho.xz_sl)
    // const Choices = getRandomStates(Zgn.RanCho.StateIdRef, Zgn.RanCho.xz_sl_now);
    // console.log(Choices)
    // console.log("gh_sl_max:",Zgn.RanCho.gh_sl_max,"GainStateIdRef",Zgn.RanCho.GainStateIdRef.length)
    //提前设置光环测试
    if (Zgn.RanCho.gh_sl_max > Zgn.RanCho.gh_sl_now) {
        SceneManager.push(Scene_StateChoice);
    }
}

/**
 * @description Scene切换是清除buff
 * @return void
 * @author zgn
 */
function cleanRandomStatesForMV() {
    Zgn.RanCho.xz_sl_now = Zgn.RanCho.xz_sl;
    Zgn.RanCho.gh_sl_now = 0;
    for (let i = 0; i < Zgn.RanCho.GainStateIdRef.length; i++) {
        $gameActors.actor(1).removeState(Zgn.RanCho.GainStateIdRef[i].state.id);
    }
}

//-----------------------------------------------------------------------------
// 场景
//-----------------------------------------------------------------------------
function Scene_StateChoice() {
    // console.log("Scene_StateChoice")
    this.initialize.apply(this, arguments);
}

Scene_StateChoice.prototype = Object.create(Scene_MenuBase.prototype);
Scene_StateChoice.prototype.constructor = Scene_StateChoice;

Scene_StateChoice.prototype.initialize = function () {
    // console.log("Scene_StateChoice:initialize")
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_StateChoice.prototype.create = function () {
    // console.log("Scene_StateChoice:create")
    Scene_MenuBase.prototype.create.call(this);
    this.createRandomChoices();
    this.createChoiceDesc();
    this.createConfirmWindow();
};

/**菜单呼叫卡牌图鉴*/
Scene_StateChoice.prototype.commandLimpid_Card = function () {
    // console.log("自定义的功能")
};

Scene_StateChoice.prototype.createRandomChoices = function () {
    // console.log("Scene_StateChoice:createTechtreeCurrency")Window_Random_Choices
    Zgn.RanCho.activeWin = 1;
    this._randomChoices = new Window_Random_Choices(0, 0, 160, 50 * Zgn.RanCho.xz_sl_now);
    this._randomChoices.activate();
    this.addWindow(this._randomChoices);
};

Scene_StateChoice.prototype.createChoiceDesc = function () {
    // console.log("Scene_StateChoice:createTechtreeCurrency")
    this._choiceDesc = new Window_Random_Choices_Desc();
    this._choiceDesc.activate();
    this.addWindow(this._choiceDesc);
};

Scene_StateChoice.prototype.createConfirmWindow = function () {
    // console.log("Scene_StateChoice:createConfirmWindow")
    this._confirmWindow = new Window_RandomChoicesConfirm();
    this._confirmWindow.setHandler('confirm', this.confirmOk.bind(this));
    this._confirmWindow.setHandler('cancel', this.confirmCancel.bind(this));
    this._confirmWindow.deactivate();
    this.addWindow(this._confirmWindow);
    // this._confirmWindow.activate();
};

Scene_StateChoice.prototype.confirmOk = function () {
    // let found = false;
    let item = Zgn.RanCho.GainStateNow
    //region 记录选项
    //选项池处理
    for (let i = 0; i < Zgn.RanCho.StateNameRef.length; i++) {
        let nameState = Zgn.RanCho.StateNameRef[i];
        if (nameState.name === item.name) {
            //如果找到了相同 name 的对象，提升buff等级
            nameState.minversion++;
            if (nameState.maxversion < nameState.minversion) {
                Zgn.RanCho.StateNameRef.splice(i, 1);
                break; // 找到后跳出循环
            }
            // found = true;
        }
    }

    //已获得选项处理
    for (let i = 0; i < Zgn.RanCho.GainStateIdRef.length; i++) {
        let state = Zgn.RanCho.GainStateIdRef[i];
        if (state.name === item.name) {
            console.log("同名buff移除", state.state.id)
            $gameActors.actor(1).removeState(state.state.id);
            Zgn.RanCho.GainStateIdRef.splice(i, 1);
            // item=state;
            break; // 找到后跳出循环
        }
    }

    Zgn.RanCho.gh_sl_now++;


    // 如果没有找到相同 name 的对象，则新增该对象到数组中
    Zgn.RanCho.GainStateIdRef.push({
        'name': item.name,
        'state': item
    });
    //endregion
    $gameActors.actor(1).addState(item.id);

    //推出界面
    this.doExitScene();

    //debug
    console.log("确认光环信息次数", Zgn.RanCho.gh_sl_now)
    console.log("确认光环信息累计:", Zgn.RanCho.GainStateIdRef)
    // console.log(":",Zgn.RanCho.GainStateIdRef.length)
    console.log("确认光环信息:", Zgn.RanCho.GainStateNow)

    //附加状态
    //可用
    // $gameActors.actor(actorId).addState(n);
    // $gameActors.actor(actorId).removeState(n);
    //状态消除
    // $gameTroop.members()[6].addState(2);
    // console.log("状态",$gameActors.actor(1))

};

Scene_StateChoice.prototype.confirmCancel = function () {
    this.closeConfirm();
};

Scene_StateChoice.prototype.openConfirm = function () {
    Zgn.RanCho.activeWin = 2;
    this._confirmWindow.activate();
    this._confirmWindow.open();
    this._confirmWindow.select(0);
    this._randomChoices.deactivate();
    // console.log("打开")
};

Scene_StateChoice.prototype.closeConfirm = function () {
    Zgn.RanCho.activeWin = 1;
    this._confirmWindow.deactivate();
    this._confirmWindow.close();
    this._confirmWindow.select(-1);
    this._randomChoices.activate();
    // console.log("关闭")
};

Scene_StateChoice.prototype.start = function () {
    // console.log("Scene_StateChoice:start")
    Scene_MenuBase.prototype.start.call(this);
};

Scene_StateChoice.prototype.update = function () {
    // console.log("Scene_StateChoice:update")
    this.updateControls();
    Scene_MenuBase.prototype.update.call(this);
};

Scene_StateChoice.prototype.doExitScene = function () {
    SceneManager.pop();
};

/**
 * @description 按键监听处理
 * @param group {$dataStates} 状态数据
 * @return void
 * @author zgn
 */
Scene_StateChoice.prototype.updateControls = function () {
    // console.log("Scene_StateChoice:updateControls")
    //要依据不同的窗口激活 映射不同的操作
    switch (Zgn.RanCho.activeWin) {
        case 1:
            if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
                this.doExitScene();
            } else if (Input.isTriggered('ok')) {
                this.openConfirm();
            }
            break;
        case 2:
            //debug用
            /*if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
                this.closeConfirm();
            } else if (Input.isTriggered('ok')) {
                // console.log("确认选择")
            }*/
            break;
        // default:
        //     默认代码块
    }
};

//-----------------------------------------------------------------------------
// 选项
//-----------------------------------------------------------------------------
function Window_Random_Choices() {
    console.log("Window_Random_Choices")
    this.initialize.apply(this, arguments);
}

Window_Random_Choices.prototype = Object.create(Window_Selectable.prototype);
Window_Random_Choices.prototype.constructor = Window_Random_Choices;

Window_Random_Choices.prototype.initialize = function (x, y, width, height) {
    console.log("Window_Random_Choices:initialize", width, height)
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._data = [];
    this.refresh();
    // this._currentActive = -1;
    this.x = -width;
};

Window_Random_Choices.prototype.maxCols = function () {
    // console.log("Window_Random_Choices:maxCols")
    return 1;
};

Window_Random_Choices.prototype.spacing = function () {
    // console.log("Window_Random_Choices:spacing")
    return 48;
};

Window_Random_Choices.prototype.maxItems = function () {
    // console.log("Window_Random_Choices:maxItems")
    return this._data ? this._data.length : 1;
};

Window_Random_Choices.prototype.data = function () {
    console.log("Window_Random_Choices:data")
    /*console.log(getRandomStates(Zgn.RanCho.StateIdRef, Zgn.RanCho.xz_sl_now)
        ,Zgn.RanCho.StateIdRef
        , Zgn.RanCho.xz_sl_now)*/
    return getRandomStates(Zgn.RanCho.StateNameRef, Zgn.RanCho.xz_sl_now);
};

Window_Random_Choices.prototype.item = function () {
    console.log("Window_Random_Choices:item")
    var index = this.index();
    // console.log("index",index)//index0开始
    return this._data && index >= 0 ? this._data[index] : null;
};

Window_Random_Choices.prototype.isCurrentItemEnabled = function () {
    console.log("Window_Random_Choices:isCurrentItemEnabled")
    return this.isEnabled(this.item());
};

Window_Random_Choices.prototype.isEnabled = function (item) {
    console.log("Window_Random_Choices:isEnabled")
    return item && item.enabled;
};

Window_Random_Choices.prototype.makeItemList = function () {
    console.log("Window_Random_Choices:makeItemList")
    this._data = [];
    var locs = this.data();
    console.log("随机选择数据格式1:", locs)
    for (let i = 0; i < locs.length; i++) {
        // 遍历原始数组的每个对象
        this._data.push(locs[i]);
        /*for (let key in locs[i]) {
            // 遍历对象的每个键（这里假设每个对象只有一个键）
            if (locs[i].hasOwnProperty(key)) {
                this._data.push(locs[i][key]);
            }
        }*/
    }
    Zgn.RanCho.GainStateNow = this._data[0]
    this.select(0);
};

Window_Random_Choices.prototype.drawItem = function (index) {
    console.log("Window_Random_Choices:drawItem")
    var item = this._data[index];
    console.log('drawItem', this._data, item)
    // console.log(item)
    if (item) {
        var rect = this.itemRect(index);
        rect.width -= this.textPadding();
        this.changePaintOpacity(this.isEnabled(item));
        this.drawText(item.name, rect.x + 10, rect.y, rect.width - 10, "left");
        this.changePaintOpacity(1);
    }
};

Window_Random_Choices.prototype.refresh = function () {
    // console.log("Window_Random_Choices:refresh")
    // console.log("maxPageItems",this.maxPageItems());
    this.makeItemList();
    this.createContents();
    this.drawAllItems();
};

Window_Random_Choices.prototype.update = function () {
    // console.log("Window_Random_Choices:update")
    this.x = Math.min(this.x + 15, 0);
    Window_Selectable.prototype.update.call(this);
    // this.select(0);
};

Window_Random_Choices.prototype.select = function (index) {
    // console.log("Window_Random_Choices:select")
    Window_Selectable.prototype.select.call(this, index);
    var item = this.item();
    if (item) {
        Zgn.RanCho.GainStateNow = item;
    }
};

Window_Random_Choices.prototype.onTouch = function (triggered) {
    console.log("Window_Random_Choices:onTouch", triggered)
    var lastIndex = this.index();
    var x = this.canvasToLocalX(TouchInput.x);
    var y = this.canvasToLocalY(TouchInput.y);
    var hitIndex = this.hitTest(x, y);
    if (hitIndex >= 0 && triggered) {
        console.log('hitIndex', hitIndex)
        if (hitIndex === this.index()) {
            if (triggered) {
                console.log('onTouch1')
                SceneManager._scene.openConfirm();
            }
        } else {
            this.select(hitIndex);
            // console.log('onTouch2')
            // SceneManager._scene.openConfirm();
        }
    }
    if (this.index() !== lastIndex) {
        SoundManager.playCursor();
    }
};

//-----------------------------------------------------------------------------
// Window_Random_Choices_Desc
//-----------------------------------------------------------------------------

function Window_Random_Choices_Desc() {
    this.initialize.apply(this, arguments);
}

Window_Random_Choices_Desc.prototype = Object.create(Window_Base.prototype);
Window_Random_Choices_Desc.prototype.constructor = Window_Random_Choices_Desc;

Window_Random_Choices_Desc.prototype.initialize = function () {
    var width = Graphics.boxWidth; // - 40;
    var height = this.fittingHeight(2);
    Window_Base.prototype.initialize.call(this, 0, 0, width, height);
    this.y = Graphics.boxHeight;
    // this._currentLocation = null;
};

Window_Random_Choices_Desc.prototype.data = function () {
    return Zgn.RanCho.GainStateNow;
};

Window_Random_Choices_Desc.prototype.refresh = function () {
    this.contents.clear();
    // console.log("Window_Random_Choices_Desc:refresh:desc",desc,Zgn.RanCho.GainStateNow)
    var desc = this.data().desc.split("|");
    for (var i = 0; i < desc.length; i++) {
        this.drawTextEx(desc[i], this.textPadding(), this.lineHeight() * i);
    }
    /*if (Galv.MAPT.active) {
        var desc = this.data().desc.split("|");
        console.log("Window_Random_Choices_Desc:refresh:desc",desc)
        for (var i = 0; i < desc.length; i++) {
            this.drawTextEx(desc[i], this.textPadding(), this.lineHeight() * i);
        }
        this._currentLocation = Galv.MAPT.active;
    }*/
};

Window_Random_Choices_Desc.prototype.update = function () {
    this.y = Math.max(this.y -= 12, Graphics.boxHeight - this.height);
    this.refresh();
    /*if (Galv.MAPT.active) {
        this.y = Math.max(this.y -= 12,Graphics.boxHeight - this.height);
    } else {
        this.y = Math.min(Graphics.boxHeight,this.y += 12);
    }
    if (this._currentLocation != Galv.MAPT.active) {
        this.refresh();
    }*/
};

//-----------------------------------------------------------------------------
//  Window_RandomChoicesConfirm
//-----------------------------------------------------------------------------

function Window_RandomChoicesConfirm() {
    this.initialize.apply(this, arguments);
}

Window_RandomChoicesConfirm.prototype = Object.create(Window_Command.prototype);
Window_RandomChoicesConfirm.prototype.constructor = Window_RandomChoicesConfirm;

Window_RandomChoicesConfirm.prototype.initialize = function () {
    console.log("Window_RandomChoicesConfirm:initialize")
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.updatePlacement();
    this.openness = 0;
};

Window_RandomChoicesConfirm.prototype.windowWidth = function () {
    // console.log("Window_RandomChoicesConfirm:windowWidth")
    return 180;
};

Window_RandomChoicesConfirm.prototype.updatePlacement = function () {
    // console.log("Window_RandomChoicesConfirm:updatePlacement")
    this.x = 100//(Graphics.boxWidth - this.windowWidth()) *  0.7;
    this.y = 100//(Graphics.boxHeight - this.height) / 2 - 54;
};

Window_RandomChoicesConfirm.prototype.makeCommandList = function () {
    // console.log("Window_RandomChoicesConfirm:makeCommandList")
    this.addCommand(Zgn.RanCho.confirmOKTxt, 'confirm');
    this.addCommand(Zgn.RanCho.confirmCanTxt, 'cancel');
};

Window_RandomChoicesConfirm.prototype.processOk = function () {
    // console.log("Window_RandomChoicesConfirm:processOk")
    Window_Command.prototype.processOk.call(this);
};


