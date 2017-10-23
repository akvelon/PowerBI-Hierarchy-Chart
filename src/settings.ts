
module powerbi.extensibility.visual {
  "use strict";
  import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

  export class VisualSettings extends DataViewObjectsParser {
    public levels: levelsSettings = new levelsSettings();
    public links: linksSettings = new linksSettings();
    public nodes: nodesSettings = new nodesSettings();
    public legend: legendSettings = new legendSettings();
    public warning: warningSettings = new warningSettings();
  }

  export class levelsSettings {
    public controls: boolean = true;
    public isMaxDepth: boolean = false;
    public maxDepth: number = 10;
  }

  export class linksSettings {
    public color: string = "black";
  }

  export class nodesSettings {
    public show: boolean = false;
    public displayHeightAndWidth: boolean = false;
    public height: number = 100;
    public width: number = 40;
    public fontSize: number = 8;
    public fontSubtitleSize: number = 8;
    public colorName: string = "";
    public distanceBetweenTitleAndSubtitle: number = 5;
    public shape: boolean = false;
  }

  export class legendSettings {
    public show: boolean = true;
    public position: string = "0";
    public showLegend: boolean = false;
    public titleLegend: string = "";
    public colorLegend: string = "black";
    public fontSize: number = 8;
  }

  export class warningSettings {
    public show: boolean = true;
  }
}
