module powerbi.extensibility.visual.chart6F792A8745784877BCD8F4ACA5AD4207  {

    export class DataStorage {
        //graphic elements
        public static selectionManager: ISelectionManager;
        public static svg: d3.Selection<SVGElement>;
        public static barGroup: d3.Selection<SVGElement>;
        public static rectangle: d3.Selection<SVGElement>;
        public static nameTextValue: d3.Selection<SVGElement>;
        public static divOuter: d3.Selection<SVGElement>;
        public static divInner: d3.Selection<SVGElement>;
        public static subtitleTextValue: d3.Selection<SVGElement>;
        public static connection: d3.Selection<SVGElement>;
        public static circle: d3.Selection<SVGElement>;
        public static warningWindow: d3.Selection<SVGElement>;
        public static warningSign: d3.Selection<SVGElement>;
        public static warningText: d3.Selection<SVGElement>;
        public static img: d3.Selection<SVGElement>;
        public static backgroundWindow: d3.Selection<SVGElement>;

        //User(Custom) settings
        public static defaultColor: string = "green";
        public static isControls: boolean = true;
        public static isMaxDepth: boolean;
        public static maxDepth: number;
        public static linksColor: string;
        public static colorName: string;
        public static displayHeightAndWidth: boolean;
        public static customShapeHeight: number;
        public static customShapeWidth: number;
        public static customFontSizeTitle: number;
        public static customFontSizeSubtitle: number;
        public static shapeType: boolean;
        public static distanceBetweenTitleAndSubtitle: number;
        public static legend: string;
        public static fontLegendSize: number;
        public static colorLegend: string;
        public static showLegendTitle: boolean;
        public static titleLegend: string;
        public static showNodes: boolean;
        public static showLegend: boolean;
        public static showWarning: boolean;

        //other variables
        public static isWarning: boolean = false;
        public static visualWindowWidth: number;
        public static visualWindowHeight: number;
        public static numbOfLevels: number;
        public static numbVisibleLevls: number;
        public static numbElemOnLevel: number[];
        public static numbVisibleElemOnLevel: number[];
        public static isDependenciesVisible: boolean = false;
        public static isExternalEventClick: boolean = false;
        public static scrollLeft: number;
        public static scrollRight: number;
        public static maxElemWeight: number = 0;
        public static errorList: string[];
        public static widthOfTheShape: number;
        public static criticalError: boolean = false;
        public static sameId: boolean = false;
        public static makeSingleEvent: boolean = false;
    }
}