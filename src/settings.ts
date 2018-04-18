
module powerbi.extensibility.visual {
  "use strict";
  import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

  export class VisualSettings extends DataViewObjectsParser {
    public levels: LevelsSettings = new LevelsSettings();
    public links: LinksSettings = new LinksSettings();
    public nodes: NodesSettings = new NodesSettings();
    public legend: LegendSettings = new LegendSettings();
    public warning: WarningSettings = new WarningSettings();

    public tooltip: TooltipSettings = new TooltipSettings();
  }

  export class LevelsSettings {
    public controls: boolean = true;
    public isMaxDepth: boolean = false;
    public maxDepth: number = 10;
  }

  export class LinksSettings {
    public color: string = "black";
  }

  export class NodesSettings {
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

  export class LegendSettings {
    public show: boolean = true;
    public position: string = "0";
    public showLegend: boolean = false;
    public titleLegend: string = "";
    public colorLegend: string = "black";
    public fontSize: number = 8;
  }

  export class WarningSettings {
    public show: boolean = true;
  }


  export class TooltipSettings {
    public show: boolean = true;
  }
}
