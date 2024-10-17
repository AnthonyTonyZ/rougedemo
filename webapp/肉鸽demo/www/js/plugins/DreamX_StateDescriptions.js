
/*:zh
* @plugindesc 状态说明
* @author zgn
* @param Command Name
* @desc 状态窗口中命令的名称
* @default Passives
*
* @param Max Columns
* @desc 要显示的最大列数
* @default 2
*
* @help
* 这个插件需要Yanfly状态菜单核心。将这个插件放在它下面。
* 使用<stateDescription:x>，其中x作为状态的notetag的描述。
* 使用<stateDescriptionHide:1>,不写或者0,都会显示
    可防止出现状态及其描述
*/

var Imported = Imported || {};
Imported.DreamX_StateDescriptions = true;

var DreamX = DreamX || {};
DreamX.StateDescriptions = DreamX.StateDescriptions || {};

(function () {
    console.log('DreamX_StateDescriptions')

    DreamX.Parameters = PluginManager.parameters('DreamX_StateDescriptions');
    DreamX.Param = DreamX.Param || {};

    DreamX.Param.stateDescriptionsCmdName = String(DreamX.Parameters['Command Name'] || "Passives");
    DreamX.Param.stateDescriptionsMaxCols = parseInt(DreamX.Parameters['Max Columns'] || 2);

    DreamX.StateDescriptions.DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function () {
        DreamX.StateDescriptions.DataManager_loadDatabase.call(this);
        if (!Imported.YEP_StatusMenuCore)
            throw "DreamX State Descriptions requires Yanfly Status Menu Core.";
    };

    DreamX.StateDescriptions.Window_StatusCommand_addCustomCommands = Window_StatusCommand.prototype.addCustomCommands;
    Window_StatusCommand.prototype.addCustomCommands = function () {
        DreamX.StateDescriptions.Window_StatusCommand_addCustomCommands.call(this);
        // console.log('passives',this.findSymbol('passives'))
        if (this.findSymbol('passives') > -1)
            return;
        var text = DreamX.Param.stateDescriptionsCmdName;
        this.addCommand(text, 'passives', true)
        console.log('passives2',this.findSymbol('passives'))
        // this.setHandler('passives','' );
    };


//=============================================================================
// Window_StatusInfo
//=============================================================================
    DreamX.StateDescriptions.Window_StatusInfo_drawInfoContents =
        Window_StatusInfo.prototype.drawInfoContents;
    Window_StatusInfo.prototype.drawInfoContents = function (symbol) {
        if (symbol === 'passives') {
            console.log('drawAllItems')
            this.drawAllItems();
        } else {
            DreamX.StateDescriptions.Window_StatusInfo_drawInfoContents.call(this, symbol);
        }
    };

    DreamX.StateDescriptions.Window_StatusInfo_maxItems = Window_StatusInfo.prototype.maxItems;
    Window_StatusInfo.prototype.maxItems = function () {
        if (this._symbol === 'passives') {
            return this._actor.statusMenuDescriptionStates().length;
        }
        return DreamX.StateDescriptions.Window_StatusInfo_maxItems.call(this);
    };

    DreamX.StateDescriptions.Window_StatusInfo_drawItem = Window_StatusInfo.prototype.drawItem;
    Window_StatusInfo.prototype.drawItem = function (index) {
        DreamX.StateDescriptions.Window_StatusInfo_drawItem.call(this);
        if (this._symbol === 'passives') {
            var state = this._actor.statusMenuDescriptionStates()[index];

            var iconBoxWidth = Window_Base._iconWidth + 4;

            var text = state.name;
            var rect = this.itemRectForText(index);

            this.drawIcon(state.iconIndex, rect.x + 2, rect.y + 2);

            this.drawTextEx(text, rect.x + iconBoxWidth, rect.y);
        }
    };

    DreamX.StateDescriptions.Window_StatusInfo_select = Window_StatusInfo.prototype.select;
    Window_StatusInfo.prototype.select = function (index) {
        DreamX.StateDescriptions.Window_StatusInfo_select.call(this, index);
        if (index < 0 || this._symbol !== 'passives') {
            return;
        }
        var state = this._actor.statusMenuDescriptionStates()[index];
        console.log("state",state)
        if (state) {
            var meta = state.meta;
            var text = meta.stateDescription ? meta.stateDescription : "";
            SceneManager._scene._helpWindow.setText(text);
        }
    };

    DreamX.StateDescriptions.Window_StatusInfo_maxCols = Window_StatusInfo.prototype.maxCols;
    Window_StatusInfo.prototype.maxCols = function () {
        if (this._symbol === 'passives') {
            return DreamX.Param.stateDescriptionsMaxCols;
        }
        return DreamX.StateDescriptions.Window_StatusInfo_maxCols.call(this);
    };

//=============================================================================
// Scene_Status
//=============================================================================

    DreamX.StateDescriptions.Scene_Status_setCommandWindowHandlers =
        Scene_Status.prototype.setCommandWindowHandlers;
    Scene_Status.prototype.setCommandWindowHandlers = function () {
        DreamX.StateDescriptions.Scene_Status_setCommandWindowHandlers.call(this);
        // when you click on the passives command, it calls the commandPassives
        // function
        this._commandWindow.setHandler('passives', this.commandPassives.bind(this));
    };

    Scene_Status.prototype.commandPassives = function () {
        // active info window and select the first state
        this._infoWindow.activate();
        this._infoWindow.select(0);
    };

    DreamX.StateDescriptions.Scene_Status_onInfoCancel = Scene_Status.prototype.onInfoCancel;
    Scene_Status.prototype.onInfoCancel = function () {
        DreamX.StateDescriptions.Scene_Status_onInfoCancel.call(this);
        var actor = this.actor();
        this._helpWindow.setText(actor.profile());
    };

//=============================================================================
// Game_Actor
//=============================================================================
    Game_Actor.prototype.statusMenuDescriptionStates = function () {
        return this.states().filter(function (state) {
            var stateDescriptionHide =state.meta.stateDescriptionHide
            // console.log('状态',stateDescriptionHide,!stateDescriptionHide)
            return stateDescriptionHide==0||!stateDescriptionHide;
        });
    };

})();
