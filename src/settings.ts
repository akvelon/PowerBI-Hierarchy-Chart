/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

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
/*
  export class dataPointSettings {
    // Default color
    public defaultColor: string = "";
    // Show all
    public showAllDataPoints: boolean = true;
    // Fill
    public fill: string = "";
    // Color saturation
    public fillRule: string = "";
    // Text Size
    public fontSize: number = 12;
  }
*/
  export class levelsSettings{
    public controls: boolean = true;
    public isMaxDepth: boolean = false;
    public maxDepth: number = 10;
  }

  export class linksSettings{
    public color: string = "black";
  }
  export class nodesSettings{
    public show: boolean = false;
    public displayHeightAndWidth: boolean = false;
    public height:  number = 100;
    public width: number = 40;
    public fontSize: number = 8;
    public fontSubtitleSize: number = 8;
    public colorName: string = "";
    public distanceBetweenTitleAndSubtitle: number = 5;
    public shape: boolean = false;
  }
 export class legendSettings{
    public show: boolean = true;
    public position: string = "0";
    public showLegend: boolean = false;
    public titleLegend: string = "";
    public colorLegend: string = "black";
    public fontSize: number = 8;
  }

  export class warningSettings{
    public show: boolean = true;
  }
}
