module powerbi.extensibility.visual {

    import ISelectionId = powerbi.visuals.ISelectionId;
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    interface DataPoint {
        id: string;
        title: string;
        reportTo: string;
        lvl: number;
        xCoordinate: number;
        yCoordinate: number;
        isVisible: boolean;
        team: string;
        teamId: number;
        position: string;
        isHeirs: boolean;
        selectionId: powerbi.visuals.ISelectionId;
        highlighted: boolean;
        elementWeight: number;
        parentStartX: number;
    };

    interface ViewModel {
        dataPoints: DataPoint[];
        teamSet?: TeamModelSet;
        highlights: boolean;
    };

    interface TeamModelSet {
        [teamName: string]: TeamModel;
    }

    interface TeamModel {
        team: string;
        teamId: number;
        color: string;
        selectionIds: ISelectionId[];
    };

    interface TeamModelList {
        teamModel: TeamModel[];
    };

    interface ColumnIndex {
        category?: number;
        title?: number;
        reportTo?: number;
        team?: number;
        position?: number;
    }

    export class Visual implements IVisual {

        public static selectionManager: ISelectionManager;
        public host: IVisualHost;
        public static svg: d3.Selection<SVGElement>;
        public static barGroup: d3.Selection<SVGElement>;
        public static rectangle: d3.Selection<SVGElement>;
        public static nameTextValue: d3.Selection<SVGElement>;
        public static divOuter: d3.Selection<SVGElement>;
        public static divInner: d3.Selection<SVGElement>;
        public static surnameTextValue: d3.Selection<SVGElement>;
        public static connection: d3.Selection<SVGElement>;
        public static circle: d3.Selection<SVGElement>;
        public static imgScroll: d3.Selection<SVGElement>;
        public static warningWindow: d3.Selection<SVGElement>;
        public static warningSign: d3.Selection<SVGElement>;
        public static warningText: d3.Selection<SVGElement>;
        public static isWarning: boolean = false;
        public static visualWindowWidth: number;
        public static VisualWindowHeight: number;
        public static numberOfLevels: number;
        public static numberOfLevelsThatIsVisible: number;
        public static numberOfElementsAtTheLevel: number[];
        public static numberOfElementsAtTheLevelThatIsVisible: number[];
        public static isDependenciesVisible: boolean = false;
        public static isExternalEventClick: boolean = false;
        public static scrollLeft: number;
        public static scrollRight: number;
        public static maximumElementWeight: number = 0;
        public static errorList: string[];
        public static widthOfTheShape

        private static TeamsColorIdentifier: DataViewObjectPropertyIdentifier = {
            objectName: "teams",
            propertyName: "fill"
        };

        //User(Custom) settings
        public static DefaultColor: string = "green";
        public static isControls: boolean = true;
        public static isMaxDepth: boolean;
        public static maxDepth: number;
        public static linksColor: string;
        public static colorName: string;
        public static displayHeightAndWidth: boolean;
        public static CustomShapeHeight: number;
        public static CustomShapeWidth: number;
        public static CustomFontSizeTitleInShape: number;
        public static CustomFontSizeSubtitleInShape: number;
        public static ShapeType: boolean;
        public static distanceBetweenTitleAndSubtitle: number;
        public static legend: string;
        public static fontLegendSize: number;
        public static colorLegend: string;
        public static showLegendTitle: boolean;
        public static titleLegend: string;
        public static showNodes: boolean;
        public static showLegend: boolean;
        public static showWarning: boolean;
        private colorPalette: IColorPalette;
        private settings: VisualSettings;
        private viewModel: ViewModel;

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
            Visual.selectionManager = options.host.createSelectionManager();
            Visual.divOuter = d3.select(options.element).append("div").classed("divOuter", true);
            Visual.divInner = Visual.divOuter.append("div");
            Visual.svg = Visual.divInner.append("svg");
            Visual.barGroup = Visual.svg
                .append("g")
                .classed("bar-group", true);
        }

        public update(options: VisualUpdateOptions) {
            Visual.scrollLeft = 0;
            Visual.scrollRight = 1;
            Visual.divOuter.style({ width: `${options.viewport.width}px`, height: `${options.viewport.height}px` });

            DrawElements.deletingOldShapes();
            let viewModel = this.getViewModel(options);

            this.viewModel = viewModel;

            this.settings = VisualSettings.parse(options
                && options.dataViews
                && options.dataViews[0]) as VisualSettings;

            Visual.visualWindowWidth = options.viewport.width;
            Visual.VisualWindowHeight = options.viewport.height;

            Visual.colorName = this.settings.nodes.colorName;
            Visual.displayHeightAndWidth = this.settings.nodes.displayHeightAndWidth;
            Visual.CustomShapeHeight = this.settings.nodes.height;
            Visual.CustomShapeWidth = this.settings.nodes.width;
            Visual.linksColor = this.settings.links.color;
            Visual.isControls = this.settings.levels.controls;
            Visual.CustomFontSizeTitleInShape = this.settings.nodes.fontSize;
            Visual.CustomFontSizeSubtitleInShape = this.settings.nodes.fontSubtitleSize;
            Visual.ShapeType = this.settings.nodes.shape;
            Visual.distanceBetweenTitleAndSubtitle = this.settings.nodes.distanceBetweenTitleAndSubtitle;
            Visual.legend = this.settings.legend.position;
            Visual.colorLegend = this.settings.legend.colorLegend;
            Visual.fontLegendSize = this.settings.legend.fontSize;
            Visual.showLegendTitle = this.settings.legend.showLegend;
            Visual.showLegend = this.settings.legend.show;
            Visual.titleLegend = this.settings.legend.titleLegend;
            Visual.isMaxDepth = this.settings.levels.isMaxDepth;
            Visual.showNodes = this.settings.nodes.show;
            Visual.showWarning = this.settings.warning.show;
            let drawElements: DrawElements = new DrawElements();
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let drawControlPanel: DrawControlPanel = new DrawControlPanel();
            let workWithTeams: WorkWithTeams = new WorkWithTeams();
            let workWithWarning: WorkWithWarning = new WorkWithWarning();
            Visual.isWarning = false;
            for (let i = 0; i < viewModel.dataPoints.length; i++) {
                if (viewModel.dataPoints[i].id == null) {
                    viewModel.dataPoints[i].id = "notFound";
                    viewModel.dataPoints[i].reportTo = "notFound";
                }
            }
            let modelWithLevels = calculationsForDrawing.findLevels(viewModel);

            if (viewModel.dataPoints.length != modelWithLevels.dataPoints.length) {
                workWithWarning.handlingOfWarnings(viewModel, modelWithLevels);
            }

            calculationsForDrawing.searchOfHeirs(modelWithLevels);
            calculationsForDrawing.numberOfElementsOnEachLevel(modelWithLevels);


            Visual.maxDepth = this.settings.levels.maxDepth;
            if ((Visual.maxDepth > 1) && (Visual.maxDepth < Visual.numberOfLevels) && (Visual.isMaxDepth)) {
                Visual.numberOfLevels = Visual.maxDepth - 1;
            }
            let numberOfVisibleLevels = Visual.numberOfLevels - 1;

            let modelWithVisibleElements = calculationsForDrawing.makingVisibleLevels(modelWithLevels, 0, numberOfVisibleLevels);
            calculationsForDrawing.findLevelsThatIsVisible(modelWithVisibleElements);
            calculationsForDrawing.numberOfElementsOnEachLevelThatIsVisible(modelWithVisibleElements);

            let listTeams = workWithTeams.joiningCommandsWithColors(modelWithVisibleElements, viewModel);
            modelWithVisibleElements = calculationsForDrawing.calculationOfWeightingCoefficients(modelWithVisibleElements);

            if (Visual.displayHeightAndWidth) {
                Visual.divOuter.style("overflow", "auto");
                if ((Visual.CustomShapeHeight > 0) && (Visual.CustomShapeWidth > 0)) {
                    Visual.VisualWindowHeight = (Visual.CustomShapeHeight + Visual.CustomShapeHeight / 1.3) * Visual.numberOfLevelsThatIsVisible;
                    if ((Visual.showWarning) && (Visual.isWarning)) {
                        Visual.VisualWindowHeight = Visual.VisualWindowHeight;
                    }
                    Visual.visualWindowWidth = Visual.CustomShapeWidth * 1.3 * Visual.maximumElementWeight;
                }
                else {
                    Visual.displayHeightAndWidth = false;
                }
            }
            Visual.visualWindowWidth = Visual.visualWindowWidth - 25;
            Visual.VisualWindowHeight = Visual.VisualWindowHeight - 25;
            let minWindowHeight = 130;
            if ((Visual.showWarning) && (Visual.isWarning)) {
                Visual.VisualWindowHeight = Visual.VisualWindowHeight;
                minWindowHeight = 180;
            }

            let heightOfTheShape = 0;
            if (options.viewport.height > minWindowHeight) {
                heightOfTheShape = drawElements.drawingElements(options, modelWithVisibleElements, listTeams, numberOfVisibleLevels);
                drawElements.drawingRelationships(modelWithVisibleElements, heightOfTheShape);
            }
            drawControlPanel.drawingControlPanel(options, modelWithVisibleElements, listTeams, heightOfTheShape, numberOfVisibleLevels);

        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            const settings: VisualSettings = this.settings
                || VisualSettings.getDefault() as VisualSettings;

            const instances = VisualSettings.enumerateObjectInstances(settings, options);

            if (options.objectName === Visual.TeamsColorIdentifier.objectName) {
                this.enumerateTeams(instances, options.objectName);
            }
            return instances;
        }

        private enumerateTeams(instanceEnumeration: VisualObjectInstanceEnumeration, objectName: string): void {
            const teams: string[] = this.viewModel && this.viewModel.teamSet && Object.keys(this.viewModel.teamSet) || [];

            if (!teams || !(teams.length > 0)) {
                return;
            }

            teams.forEach((teamName: string) => {
                const identity: ISelectionId = this.viewModel.teamSet[teamName].selectionIds[0] as ISelectionId,
                    displayName: string = this.viewModel.teamSet[teamName].team;

                this.addAnInstanceToEnumeration(instanceEnumeration, {
                    displayName,
                    objectName,
                    selector: ColorHelper.normalizeSelector(identity.getSelector(), false),
                    properties: {
                        fill: { solid: { color: this.viewModel.teamSet[teamName].color } }
                    }
                });
            });
        }

        private getColor(
            properties: DataViewObjectPropertyIdentifier,
            defaultColor: string,
            objects: DataViewObjects): string {

            const colorHelper: ColorHelper = new ColorHelper(
                this.colorPalette,
                properties,
                defaultColor);

            return colorHelper.getColorForMeasure(objects, "");
        }

        private addAnInstanceToEnumeration(
            instanceEnumeration: VisualObjectInstanceEnumeration,
            instance: VisualObjectInstance): void {

            if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
                (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                    .instances
                    .push(instance);
            } else {
                (instanceEnumeration as VisualObjectInstance[]).push(instance);
            }
        }

        private getViewModel(options: VisualUpdateOptions): ViewModel {
            let dataViews: DataView[] = options.dataViews;

            let viewModel: ViewModel = {
                dataPoints: [],
                teamSet: {},
                highlights: false
            };

            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].categorical
                || !dataViews[0].categorical.categories
            ) {
                return viewModel;
            }

            const dataView: DataView = dataViews[0];

            const columnIndexes: ColumnIndex = {
                category: -1,
                title: -1,
                reportTo: -1,
                team: -1,
                position: -1,
            };

            dataView.metadata.columns.forEach((column: DataViewMetadataColumn, columnIndex: number) => {
                Object.keys(column.roles).forEach((roleName: string) => {
                    columnIndexes[roleName] = columnIndex;
                });
            });

            const categories: DataViewCategoryColumn[] = dataView.categorical.categories;
            const amountOfDataPoints: number = categories[0].values.length;
            const highlights = dataView.categorical.values
                && dataView.categorical.values[0]
                && dataView.categorical.values[0].highlights
                || [];
            for (let dataPointIndex: number = 0; dataPointIndex < amountOfDataPoints; dataPointIndex++) {

                const id: string = categories[columnIndexes.category].values[dataPointIndex] as string;
                const title: string = categories[columnIndexes.title].values[dataPointIndex] as string;
                const reportTo: string = categories[columnIndexes.reportTo].values[dataPointIndex] as string;

                const lvl: number = 0 as number;
                const xCoordinate: number = 0 as number;
                const yCoordinate: number = 0 as number;
                const isVisible: boolean = false as boolean;
                let team: string = " " as string;
                let position: string = " " as string;
                if (categories[columnIndexes.position] == undefined) {
                    position = " ";
                } else {
                    position = categories[columnIndexes.position].values[dataPointIndex] as string;
                }
                if (categories[columnIndexes.team] == undefined) {
                    team = " ";
                } else {
                    team = categories[columnIndexes.team].values[dataPointIndex] as string;
                }
                const teamId: number = 0 as number;
                const isHeirs: boolean = false as boolean;
                const elementWeight: number = 0 as number;
                const parentStartX: number = 0 as number;

                const highlighted: boolean = highlights ? highlights[dataPointIndex] ? true : false : false;
                const selectionId = this.host.createSelectionIdBuilder()
                    .withCategory(categories[columnIndexes.category], dataPointIndex)
                    .createSelectionId();

                if (!viewModel.teamSet[team]) {
                    const color: string = this.getColor(
                        Visual.TeamsColorIdentifier,
                        Visual.DefaultColor,
                        categories[columnIndexes.category].objects
                        && categories[columnIndexes.category].objects[dataPointIndex]
                        || {});

                    viewModel.teamSet[team] = {
                        team,
                        selectionIds: [selectionId],
                        color,
                        teamId
                    }
                } else {
                    viewModel.teamSet[team].selectionIds.push(selectionId);
                }

                viewModel.dataPoints.push({
                    id,
                    title,
                    reportTo: reportTo || " ",
                    lvl,
                    xCoordinate,
                    yCoordinate,
                    isVisible,
                    team,
                    position,
                    selectionId,
                    teamId,
                    highlighted,
                    isHeirs,
                    elementWeight,
                    parentStartX
                });
            }
            viewModel.highlights = viewModel.dataPoints.filter(d => d.highlighted).length > 0;

            return viewModel;
        }
    }

    class DrawControlPanel {
        static xStartCoordinate = 0;
        static displayScroll = false;
        public drawingControlPanel(options: VisualUpdateOptions, newModel: ViewModel, listTeams: TeamModelList, heightOfTheShape, numberOfVisibleLevels) {

            if ((Visual.isControls) && (options.viewport.height > 130)) {
                this.drawingControlButtons(options, heightOfTheShape, newModel, numberOfVisibleLevels, listTeams);
            }
            if (Visual.showLegend) {
                if (Visual.legend == "0") {
                    
                    this.drawingMarks(options, listTeams, heightOfTheShape, newModel, true);
                    if (DrawControlPanel.displayScroll) {
                        this.scrollButtonLeft(options, newModel, listTeams, heightOfTheShape, numberOfVisibleLevels, true);
                        this.scrollButtonRight(options, newModel, listTeams, heightOfTheShape, numberOfVisibleLevels, true);
                    }
                }
                if (Visual.legend == "1") {

                    this.drawingMarks(options, listTeams, heightOfTheShape, newModel, false);
                    if (DrawControlPanel.displayScroll) {
                        this.scrollButtonLeft(options, newModel, listTeams, heightOfTheShape, numberOfVisibleLevels, false);
                        this.scrollButtonRight(options, newModel, listTeams, heightOfTheShape, numberOfVisibleLevels, false);
                    }
                }
                if (Visual.legend == "2") {
                    this.drawingMarksAuto(options, listTeams, heightOfTheShape, newModel);
                }
            }
            if ((Visual.showWarning) && (Visual.isWarning)) {
                let drawWarning: DrawWarning = new DrawWarning();
                drawWarning.drawingWarningSign(options);
            }
        }

        public drawingControlButtons(options: VisualUpdateOptions, heightOfTheShape, newModel: ViewModel, numberOfVisibleLevels, listTeams: TeamModelList) {


            let xButtonCoordinateAdd = newModel.dataPoints[0].xCoordinate - Visual.widthOfTheShape / 1.1;
            let xButtonCoordinateMinus = newModel.dataPoints[0].xCoordinate + Visual.widthOfTheShape / 1.1;


            if (Visual.displayHeightAndWidth) {
                heightOfTheShape = Visual.CustomShapeHeight;
            }
            let yButtonCoordinate = newModel.dataPoints[0].yCoordinate - heightOfTheShape / 1.2;

            this.drowingButton(options, yButtonCoordinate, xButtonCoordinateAdd, newModel, numberOfVisibleLevels, listTeams, true, "+");
            this.drowingButton(options, yButtonCoordinate, xButtonCoordinateMinus, newModel, numberOfVisibleLevels, listTeams, false, "-");
        }

        public drowingButton(options: VisualUpdateOptions, yCoordinate, xCoordinate, newModel: ViewModel, numberOfVisibleLevels, listTeams: TeamModelList, isChangeLevel, sign) {

            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true);

            Visual.nameTextValue
                .text(sign)
                .attr({
                    x: xCoordinate,
                    y: yCoordinate,
                    dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", 40 + "px")
                .style("text-align", "left")
                .on('click', () => {
                    this.clickButtonEvent(newModel, options, numberOfVisibleLevels, listTeams, isChangeLevel);
                })
        }

        public clickButtonEvent(newModel: ViewModel, options: VisualUpdateOptions, numberOfVisibleLevels, listTeams: TeamModelList, isChangeLevel) {
            DrawElements.deletingOldShapes();
            if (isChangeLevel) {
                if (numberOfVisibleLevels < Visual.numberOfLevels - 1) {
                    numberOfVisibleLevels = numberOfVisibleLevels + 1;
                }
            }
            else {
                if (numberOfVisibleLevels + 1 > 1) {
                    numberOfVisibleLevels = numberOfVisibleLevels - 1;
                }
            }
            Visual.scrollLeft = 0;
            Visual.scrollRight = 1;
            let drawElements: DrawElements = new DrawElements();
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let modelWithVisibleElements = calculationsForDrawing.makingVisibleLevels(newModel, 0, numberOfVisibleLevels);
            calculationsForDrawing.findLevelsThatIsVisible(modelWithVisibleElements);
            calculationsForDrawing.numberOfElementsOnEachLevelThatIsVisible(modelWithVisibleElements);
            modelWithVisibleElements = calculationsForDrawing.calculationOfWeightingCoefficients(modelWithVisibleElements);
            let heightOfTheShape = drawElements.drawingElements(options, modelWithVisibleElements, listTeams, numberOfVisibleLevels);
            drawElements.drawingRelationships(modelWithVisibleElements, heightOfTheShape);
            this.drawingControlPanel(options, modelWithVisibleElements, listTeams, heightOfTheShape, numberOfVisibleLevels);
        }


        public scrollButtonLeft(options, modelWithVisibleElements, listTeams, heightOfTheShape, numberOfVisibleLevels, isBottom) {

            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true);

            let yCoordinate = 0;
            if (isBottom) {
                yCoordinate = 5 + 6 * Visual.fontLegendSize / 10;
            }
            else {
                yCoordinate = Visual.VisualWindowHeight - 6 * Visual.fontLegendSize / 10 - 45;
            }
            if ((Visual.showWarning) && (Visual.isWarning)) {
                yCoordinate = yCoordinate + 40;
            }
            let xCoordinateButton = 6;
            if (Visual.showLegendTitle) {
                xCoordinateButton = DrawControlPanel.xStartCoordinate - 10;
            }
            Visual.nameTextValue
                .text("<")
                .attr({
                    x: xCoordinateButton,
                    y: yCoordinate,
                    dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", 25 + "px")
                .style("font-family", "cursive")
                .style("text-align", "left")
                .on('click', () => {
                    if (Visual.scrollLeft > 0) {
                        Visual.scrollLeft--;
                        Visual.scrollRight--;
                        Visual.barGroup.selectAll(".controlPanel").remove();

                        let radius = 5;
                        let widthWindow = Visual.visualWindowWidth;
                        let xCoordinate = radius * 4;
                        if (Visual.showLegendTitle) {
                            xCoordinate = DrawControlPanel.xStartCoordinate;
                        }
                        let yCircleCoordinate = radius * 1.2;
                        if (isBottom) {
                            yCircleCoordinate = 5 + 6 * Visual.fontLegendSize / 10;
                        }
                        else {
                            yCircleCoordinate = Visual.VisualWindowHeight - 6 * Visual.fontLegendSize / 10 - 45;
                        }
                        if ((Visual.showWarning) && (Visual.isWarning)) {
                            yCircleCoordinate = yCircleCoordinate + 40;
                        }
                        let isTransparent = false;

                        for (let i = Visual.scrollLeft; i < Visual.scrollRight; i++) {
                           if ((listTeams.teamModel[i].team != null)&&(listTeams.teamModel[i].team != "")&&(listTeams.teamModel[i].team != " ")) {
                                let color = listTeams.teamModel[i].color;
                                if (i < listTeams.teamModel.length) {
                                    this.drawingColorMarks(options, xCoordinate, yCircleCoordinate, radius, color, listTeams, i, isTransparent);
                                    xCoordinate = xCoordinate + radius * 2;
                                    this.drawingTextMarks(options, xCoordinate, yCircleCoordinate, listTeams.teamModel[i].team, radius, false);
                                    xCoordinate = xCoordinate + listTeams.teamModel[i].team.length * 4 * Visual.fontLegendSize / 5;
                                }
                            }
                        }

                    }
                })
        }

        public scrollButtonRight(options, modelWithVisibleElements, listTeams: TeamModelList, heightOfTheShape, numberOfVisibleLevels, isBottom) {

            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true);

            let yCoordinate = 0;
            if (isBottom) {
                yCoordinate = 5 + 6 * Visual.fontLegendSize / 10;
            }
            else {
                yCoordinate = Visual.VisualWindowHeight - 6 * Visual.fontLegendSize / 10 - 45;
            }
            if ((Visual.showWarning) && (Visual.isWarning)) {
                yCoordinate = yCoordinate + 40;
            }
            Visual.nameTextValue
                .text(">")
                .attr({
                    x: Visual.visualWindowWidth - 6,
                    y: yCoordinate,
                    dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", 25 + "px")
                .style("font-family", "cursive")
                .style("text-align", "left")
                .on('click', () => {
                    if (Visual.scrollRight < listTeams.teamModel.length) {
                        
                                               
                        Visual.scrollRight++;
                        Visual.scrollLeft++;

                        Visual.barGroup.selectAll(".controlPanel").remove();
                        let radius = 5;
                        let widthWindow = Visual.visualWindowWidth;
                        
                        let xCoordinate = radius * 4;
                        if (Visual.showLegendTitle) {
                            xCoordinate = DrawControlPanel.xStartCoordinate;
                        }
                        let yCircleCoordinate = radius * 1.2;
                        if (isBottom) {
                            yCircleCoordinate = 5 + 6 * Visual.fontLegendSize / 10;
                        }
                        else {
                            yCircleCoordinate = Visual.VisualWindowHeight - 6 * Visual.fontLegendSize / 10 - 45;
                        }
                        if ((Visual.showWarning) && (Visual.isWarning)) {
                            yCircleCoordinate = yCircleCoordinate + 40;
                        }
                        let isTransparent = false;
                        for (let i = Visual.scrollLeft; i < Visual.scrollRight; i++) {
                            if ((listTeams.teamModel[i].team != null)&&(listTeams.teamModel[i].team != "")&&(listTeams.teamModel[i].team != " ")) {
                                let color = listTeams.teamModel[i].color;
                                if (i < listTeams.teamModel.length) {
                                    this.drawingColorMarks(options, xCoordinate, yCircleCoordinate, radius, color, listTeams, i, isTransparent);
                                    xCoordinate = xCoordinate + radius * 2;
                                    this.drawingTextMarks(options, xCoordinate, yCircleCoordinate, listTeams.teamModel[i].team, radius, false);
                                    xCoordinate = xCoordinate + listTeams.teamModel[i].team.length * 4 * Visual.fontLegendSize / 5;
                                }
                            }
                        }
                    }
                })
        }


        public drawingMarksAuto(options: VisualUpdateOptions, listTeams: TeamModelList, heightOfTheShape, newModel: ViewModel) {

            let radius = heightOfTheShape / (listTeams.teamModel.length * 1.5);
            let widthWindow = Visual.visualWindowWidth;
            let xCircleCoordinate = radius * 1.2;
            let yCircleCoordinate = radius * 1.5;
            let yCircleCoordinateForTheSecondHalf = radius * 1.5;
            if ((Visual.showWarning) && (Visual.isWarning)) {
                yCircleCoordinateForTheSecondHalf = yCircleCoordinateForTheSecondHalf + 40;
                yCircleCoordinate = yCircleCoordinate + 40;
            }
            let isTransparent = false;

            for (let i = 0; i < listTeams.teamModel.length; i++) {
                if ((listTeams.teamModel[i].team != null)&&(listTeams.teamModel[i].team != "")&&(listTeams.teamModel[i].team != " ")) {
                    let color = listTeams.teamModel[i].color;
                    if (i < (listTeams.teamModel.length / 2)) {
                        this.drawingColorMarks(options, xCircleCoordinate, yCircleCoordinate, radius, color, listTeams, i, isTransparent);
                        this.drawingTextMarksAuto(options, xCircleCoordinate + radius * 2, yCircleCoordinate, listTeams.teamModel[i].team, radius, true);
                        yCircleCoordinate = yCircleCoordinate + radius * 2.5;
                    }
                    else {
                        xCircleCoordinate = widthWindow - radius * 1.2;
                        this.drawingColorMarks(options, xCircleCoordinate, yCircleCoordinateForTheSecondHalf, radius, color, listTeams, i, isTransparent);
                        this.drawingTextMarksAuto(options, Visual.visualWindowWidth - radius * 3, yCircleCoordinateForTheSecondHalf, listTeams.teamModel[i].team, radius, false);
                        yCircleCoordinateForTheSecondHalf = yCircleCoordinateForTheSecondHalf + radius * 2.5;
                    }
                }
            }
        }
        public drawingMarks(options: VisualUpdateOptions, listTeams: TeamModelList, heightOfTheShape, newModel: ViewModel, isBottom) {
            let radius = 5;
            let widthWindow = Visual.visualWindowWidth;
            let xCoordinate = radius * 4;
            let yCircleCoordinate = radius * 1.2;
            if (isBottom) {
                yCircleCoordinate = 5 + radius * 1.2 * Visual.fontLegendSize / 10;
            }
            else {
                yCircleCoordinate = Visual.VisualWindowHeight - radius * 1.2 * Visual.fontLegendSize / 10 - 45;
            }
            if ((Visual.showWarning) && (Visual.isWarning)) {
                yCircleCoordinate = yCircleCoordinate + 40;
            }
            if (Visual.showLegendTitle) {
                this.drawingTextMarks(options, xCoordinate, yCircleCoordinate, Visual.titleLegend, radius, true);
                xCoordinate = xCoordinate + Visual.titleLegend.length * 6 * Visual.fontLegendSize / 5;
                DrawControlPanel.xStartCoordinate = xCoordinate;
            }
            let isTransparent = false;
            DrawControlPanel.displayScroll = false;
            for (let i = Visual.scrollLeft; i < Visual.scrollRight; i++) {

                if ((listTeams.teamModel[i].team != null)&&(listTeams.teamModel[i].team != "")&&(listTeams.teamModel[i].team != " ")) {
                    let color = listTeams.teamModel[i].color;
                    if (i < listTeams.teamModel.length) {
                        this.drawingColorMarks(options, xCoordinate, yCircleCoordinate, radius, color, listTeams, i, isTransparent);
                        xCoordinate = xCoordinate + radius * 2;
                        this.drawingTextMarks(options, xCoordinate, yCircleCoordinate, listTeams.teamModel[i].team, radius, false);
                        xCoordinate = xCoordinate + listTeams.teamModel[i].team.length * 4 * Visual.fontLegendSize / 5;
                    }
                    if ((xCoordinate < Visual.visualWindowWidth - 50) && (Visual.scrollRight < listTeams.teamModel.length)) {
                        
                        Visual.scrollRight++;
                    }
                    if ((xCoordinate > Visual.visualWindowWidth - 50)) {
                        DrawControlPanel.displayScroll = true;
                    }
                }
                else { 
                    if((xCoordinate < Visual.visualWindowWidth - 50) && (Visual.scrollRight < listTeams.teamModel.length)) {
                        Visual.scrollRight++; 
                    }
                }
            }
            Visual.scrollRight--;
        }


        public drawingColorMarks(options: VisualUpdateOptions, xCircleCoordinate, yCircleCoordinate, radius, color, listTeams: TeamModelList, i, isTransparent) {

            Visual.circle = Visual.barGroup.append("circle")
                .classed('circle', true).classed("team" + listTeams.teamModel[i].teamId, true).classed("controlPanel", true);

            Visual.circle
                .style("fill", color)
                .style("stroke", "black")
                .style("stroke-width", 1)
                .attr({
                    r: radius,
                    cx: xCircleCoordinate,
                    cy: yCircleCoordinate
                })
                .on('click', () => {
                    Visual.selectionManager.clear();

                    if (!isTransparent) {
                        Visual.barGroup
                            .selectAll(".rectangle")
                            .style('opacity', 0.5);

                        Visual.barGroup
                            .selectAll(".circle")
                            .style('opacity', 0.5);

                        Visual.barGroup
                            .selectAll(".team" + listTeams.teamModel[i].teamId)
                            .style('opacity', 1);

                        listTeams.teamModel[i].selectionIds.forEach((selectionId) => {
                            Visual.selectionManager.select(selectionId, true);
                        });

                        isTransparent = true;
                    }
                    else {
                        Visual.barGroup
                            .selectAll(".rectangle")
                            .style('opacity', 1);

                        Visual.barGroup
                            .selectAll(".circle")
                            .style('opacity', 1);
                        isTransparent = false;
                    }
                })
        }

        public drawingTextMarks(options: VisualUpdateOptions, xCircleCoordinate, yCircleCoordinate, team, radius, isHeading) {

            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            CalculationsForDrawing
            let fontSize = calculationsForDrawing.definitionOfTheSmallestValue(radius * 2.5, Visual.visualWindowWidth / 60);
            let className = "";
            if(!isHeading){
                className = "controlPanel";
            }
            else{
                className = "isHeading";
            }
            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true).classed(className, true);

            Visual.nameTextValue
                .text(team)
                .attr({
                    x: xCircleCoordinate,
                    y: yCircleCoordinate,
                    dy: "0.35em",
                }).style("font-size", Visual.fontLegendSize + "px")
                .style("fill", Visual.colorLegend)
                .style("opacity ", "0.9")
                .style("position", "relative")
                .style("text-align", "left")
        }

        public drawingTextMarksAuto(options: VisualUpdateOptions, xCircleCoordinate, yCircleCoordinate, team, radius, position) {
            let textAnchor;
            if (position) {
                textAnchor = "start";
            }
            else {
                textAnchor = "end";
            }
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            CalculationsForDrawing
            let fontSize = calculationsForDrawing.definitionOfTheSmallestValue(radius * 2.5, Visual.visualWindowWidth / 60);

            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true);

            Visual.nameTextValue
                .text(team)
                .attr({
                    x: xCircleCoordinate,
                    y: yCircleCoordinate,
                    dy: "0.35em",
                    "text-anchor": textAnchor
                }).style("font-size", Visual.fontLegendSize)
                .style("text-align", "left")
                .style("fill", Visual.colorLegend)
        }
    }

    class DrawElements {

        public drawingElements(options: VisualUpdateOptions, newModel: ViewModel, listTeams: TeamModelList, numberOfVisibleLevels): number {

            Visual.svg.attr({
                width: Visual.visualWindowWidth,
                height: Visual.VisualWindowHeight
            });
            let widthOfTheShape = 0;
            let heightOfTheShape = 0;
            let windowHeight = Visual.VisualWindowHeight - 100;
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            heightOfTheShape = calculationsForDrawing.calculatingTheHeightOfShape(windowHeight);
            heightOfTheShape = calculationsForDrawing.definitionOfTheSmallestValue(heightOfTheShape, windowHeight / 5)
            widthOfTheShape = calculationsForDrawing.calculatingTheWidthOfShape(Visual.visualWindowWidth, newModel.dataPoints[0].elementWeight);
            widthOfTheShape = calculationsForDrawing.definitionOfTheSmallestValue(widthOfTheShape, Visual.visualWindowWidth / 5)
            let isHeightGreaterThanWidth = calculationsForDrawing.definitionOfTheLargerValue(heightOfTheShape, widthOfTheShape);

            if (Visual.displayHeightAndWidth) {
                heightOfTheShape = Visual.CustomShapeHeight;
                widthOfTheShape = Visual.CustomShapeWidth;
            }
            Visual.widthOfTheShape = widthOfTheShape;

            let fontSizeValue: number = heightOfTheShape / 7;

            let xCenterCoordinate = 0;
            let yCenterCoordinate;
            if ((Visual.legend == "0") && (Visual.showLegend)) {
                yCenterCoordinate = 10 + heightOfTheShape + (heightOfTheShape / 2) * Visual.fontLegendSize / 20;
            }
            else {
                yCenterCoordinate = heightOfTheShape + (heightOfTheShape / 7);
            }
            if ((Visual.showWarning) && (Visual.isWarning)) {
                yCenterCoordinate = yCenterCoordinate + 50;
            }

            let gapWidth = widthOfTheShape * 1.2 - widthOfTheShape;
            let gapHeight = heightOfTheShape / 1.3;
            let minX = (Visual.visualWindowWidth / Visual.maximumElementWeight) - gapWidth;

            let currentLevel = 0;
            let parent;
            let oldParent = "-";
            let xAddValueCoordinate = 0;
            let predAdd = 0;

            while (currentLevel <= Visual.numberOfLevelsThatIsVisible) {
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {
                        parent = newModel.dataPoints[i].reportTo;

                        if ((parent != oldParent)) {
                            for (let j = 0; j < newModel.dataPoints.length; j++) {
                                if (newModel.dataPoints[j].id == parent) {
                                    xCenterCoordinate = newModel.dataPoints[j].parentStartX;
                                    predAdd = 0;
                                }
                            }
                        }

                        newModel.dataPoints[i].parentStartX = xCenterCoordinate + predAdd;
                        xAddValueCoordinate = ((minX + gapWidth) * newModel.dataPoints[i].elementWeight) / 2;
                        xCenterCoordinate = predAdd + xCenterCoordinate + xAddValueCoordinate;
                        predAdd = xAddValueCoordinate;
                        oldParent = parent;

                        let color = calculationsForDrawing.colorDefinitionByCommand(newModel, i, listTeams);
                        if (Visual.ShapeType) {
                            this.drawingEllipse(xCenterCoordinate, yCenterCoordinate, heightOfTheShape, widthOfTheShape, newModel, options, listTeams, color, numberOfVisibleLevels, newModel.dataPoints[i].lvl, i);
                        }
                        else {
                            this.drawingRectangle(xCenterCoordinate, yCenterCoordinate, heightOfTheShape, widthOfTheShape, newModel, options, listTeams, color, numberOfVisibleLevels, newModel.dataPoints[i].lvl, i);
                        }
                        if (newModel.dataPoints[i].isHeirs) {
                            this.drawingExpandOrCollapseButton(xCenterCoordinate, yCenterCoordinate, heightOfTheShape, widthOfTheShape, newModel, options, listTeams, color, numberOfVisibleLevels, newModel.dataPoints[i].lvl, i);
                        }

                        let offsetValue = Visual.distanceBetweenTitleAndSubtitle;
                        this.drawingTitle(xCenterCoordinate, yCenterCoordinate, newModel.dataPoints[i].title, newModel, options, i, fontSizeValue, offsetValue, listTeams, numberOfVisibleLevels, newModel.dataPoints[i].lvl, isHeightGreaterThanWidth);
                        this.drawingSubtitle(xCenterCoordinate, yCenterCoordinate, newModel, options, i, fontSizeValue, offsetValue, listTeams, numberOfVisibleLevels, newModel.dataPoints[i].lvl, isHeightGreaterThanWidth);

                        newModel.dataPoints[i].xCoordinate = xCenterCoordinate;
                        newModel.dataPoints[i].yCoordinate = yCenterCoordinate;
                    }
                }
                predAdd = 0;
                xCenterCoordinate = 0;
                yCenterCoordinate = yCenterCoordinate + gapHeight * 2;
                currentLevel++;
            }
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                newModel.dataPoints[i].parentStartX = 0;
            }
            return heightOfTheShape;
        }

        public drawingExpandOrCollapseButton(xCenterCoordinate, yCenterCoordinate, heightOfTheShape, widthOfTheShape, newModel: ViewModel, options, listTeams: TeamModelList, color, numberOfVisibleLevels, lvl, i) {
            let tempxCenterCoordinate = xCenterCoordinate;
            let tempyCenterCoordinate = yCenterCoordinate;

            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let workWithTeams: WorkWithTeams = new WorkWithTeams();
            let teamId = workWithTeams.joiningPersonsWithTeamId(newModel.dataPoints[i].team, listTeams);
            let transparency = 1;
            if (Visual.isExternalEventClick) { transparency = 0.5 }
            Visual.circle = Visual.barGroup.append("circle")
                .classed('circle', true).classed("team" + teamId, true);
            let value = "+";
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                if ((newModel.dataPoints[j].reportTo == newModel.dataPoints[i].id) && (newModel.dataPoints[j].isVisible)) { value = "-"; }
            }
            if (newModel.dataPoints[i].reportTo == " ") {
                value = " ";
            }
            Visual.circle
                .style("fill", color)
                .style("stroke", "black")
                .style("stroke-width", 1)
                .attr({
                    r: 6,
                    cx: xCenterCoordinate,
                    cy: yCenterCoordinate
                })
                .on('click', () => {

                    let nameOfTheParent = calculationsForDrawing.nameDeterminationByCoordinates(newModel, tempxCenterCoordinate, tempyCenterCoordinate);
                    if (lvl != 0) {
                        this.clickEvent(newModel, options, nameOfTheParent, listTeams, numberOfVisibleLevels, i);
                    }
                })

            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true);

            Visual.nameTextValue
                .text(value)
                .attr({
                    x: xCenterCoordinate,
                    y: yCenterCoordinate + 6,
                    //dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", "19px")


                .on('click', () => {

                    let nameOfTheParent = calculationsForDrawing.nameDeterminationByCoordinates(newModel, tempxCenterCoordinate, tempyCenterCoordinate);
                    if (lvl != 0) {
                        this.clickEvent(newModel, options, nameOfTheParent, listTeams, numberOfVisibleLevels, i);
                    }
                })
            if (newModel.dataPoints[i].highlighted) {
                Visual.rectangle.style("opacity", 1);
            }
        }

        public drawingEllipse(xCenterCoordinate, yCenterCoordinate, heightOfTheShape, widthOfTheShape, newModel: ViewModel, options, listTeams: TeamModelList, color, numberOfVisibleLevels, lvl, i) {
            let tempxCenterCoordinate = xCenterCoordinate;
            let tempyCenterCoordinate = yCenterCoordinate;

            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let workWithTeams: WorkWithTeams = new WorkWithTeams();
            let teamId = workWithTeams.joiningPersonsWithTeamId(newModel.dataPoints[i].team, listTeams);
            let transparency = 1;
            if (Visual.isExternalEventClick) { transparency = 0.5 }
            Visual.rectangle = Visual.barGroup.append("ellipse")
                .classed('rectangle', true).classed("team" + teamId, true);
            Visual.rectangle
                .style("fill", color)
                .style("opacity", transparency)
                .style("stroke", "black")
                .style("stroke-width", 2)
                .attr({
                    cx: xCenterCoordinate,
                    cy: yCenterCoordinate - heightOfTheShape / 2,
                    rx: widthOfTheShape / 2,
                    ry: heightOfTheShape / 2
                })
                .on('click', () => {

                    let nameOfTheParent = calculationsForDrawing.nameDeterminationByCoordinates(newModel, tempxCenterCoordinate, tempyCenterCoordinate);
                    if (lvl != 0) {
                        this.clickEvent(newModel, options, nameOfTheParent, listTeams, numberOfVisibleLevels, i);
                    }
                })
            if (newModel.dataPoints[i].highlighted) {
                Visual.rectangle.style("opacity", 1);
            }
        }

        public drawingRectangle(xCenterCoordinate, yCenterCoordinate, heightOfTheShape, widthOfTheShape, newModel: ViewModel, options, listTeams: TeamModelList, color, numberOfVisibleLevels, lvl, i) {
            let tempxCenterCoordinate = xCenterCoordinate;
            let tempyCenterCoordinate = yCenterCoordinate;

            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let workWithTeams: WorkWithTeams = new WorkWithTeams();
            let teamId = workWithTeams.joiningPersonsWithTeamId(newModel.dataPoints[i].team, listTeams);
            let transparency = 1;
            if (Visual.isExternalEventClick) { transparency = 0.5 }
            Visual.rectangle = Visual.barGroup.append("rect")
                .classed('rectangle', true).classed("team" + teamId, true);

            Visual.rectangle
                .style("fill", color)
                .style("opacity", transparency)
                .style("stroke", "black")
                .style("stroke-width", 2)
                .attr({
                    rx: 6,
                    x: xCenterCoordinate - widthOfTheShape / 2,
                    y: yCenterCoordinate - heightOfTheShape,
                    width: widthOfTheShape,
                    height: heightOfTheShape
                })
                .on('click', () => {
                    let nameOfTheParent = calculationsForDrawing.nameDeterminationByCoordinates(newModel, tempxCenterCoordinate, tempyCenterCoordinate);
                    if (lvl != 0) {
                        this.clickEvent(newModel, options, nameOfTheParent, listTeams, numberOfVisibleLevels, i);
                    }
                })

            if (newModel.dataPoints[i].highlighted) {
                Visual.rectangle.style("opacity", 1);
            }

        }

        public drawingTitle(xCenterCoordinate, yCenterCoordinate, title, newModel, options, i, fontSizeValue, offsetValue, listTeams: TeamModelList, numberOfVisibleLevels, lvl, isHeightGreaterThanWidth) {
            let writingMode;
            let xCoordinate;
            let yCoordinate;
            if (isHeightGreaterThanWidth) {
                writingMode = "tb";
                xCoordinate = xCenterCoordinate + offsetValue;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3;
            }
            else {
                writingMode = "bt";
                xCoordinate = xCenterCoordinate;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3 - offsetValue;
            }
            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true);

            Visual.nameTextValue
                .text(title)
                .attr({
                    x: xCoordinate,
                    y: yCoordinate,
                    //dy: "0.35 em",
                    "text-anchor": "middle"
                }).style("font-size", Visual.CustomFontSizeTitleInShape + "px")
                .style("fill", Visual.colorName)
                .style("writing-mode", writingMode)
                .on('click', () => {
                    if (lvl != 0)
                    { this.clickEvent(newModel, options, newModel.dataPoints[i].id, listTeams, numberOfVisibleLevels, i); }
                });
        }

        public drawingSubtitle(xCenterCoordinate, yCenterCoordinate, newModel: ViewModel, options, i, fontSizeValue, offsetValue, listTeams: TeamModelList, numberOfVisibleLevels, lvl, isHeightGreaterThanWidth) {
            let writingMode;
            let xCoordinate;
            let yCoordinate;
            if (isHeightGreaterThanWidth) {
                writingMode = "tb";
                xCoordinate = xCenterCoordinate - offsetValue;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3;
            }
            else {
                writingMode = "bt";
                xCoordinate = xCenterCoordinate;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3 + offsetValue;
            }
            Visual.surnameTextValue = Visual.barGroup.append("text")
                .classed("surnameTextValue", true);
           
            Visual.surnameTextValue
                .text(newModel.dataPoints[i].position)
                .attr({
                    x: xCoordinate,
                    y: yCoordinate,
                    //dy: "0.35 em",
                    "text-anchor": "middle"
                })
                .style("fill", Visual.colorName)
                .style("font-size", Visual.CustomFontSizeSubtitleInShape + "px")
                .style("writing-mode", writingMode)
                .on('click', () => {
                    if (lvl != 0)
                    { this.clickEvent(newModel, options, newModel.dataPoints[i].id, listTeams, numberOfVisibleLevels, i); }
                });
        }

        public clickEvent(newModel: ViewModel, options: VisualUpdateOptions, nameOfTheParent, listTeams: TeamModelList, numberOfVisibleLevels, i) {

            DrawElements.deletingOldShapes();
            Visual.scrollLeft = 0;
            Visual.scrollRight = 1;
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                if (newModel.dataPoints[i].id == newModel.dataPoints[j].reportTo) {
                    Visual.isDependenciesVisible = newModel.dataPoints[j].isVisible;
                }
            }
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            if (Visual.isDependenciesVisible) {
                newModel = calculationsForDrawing.makingVisibleAndInVisibleHeir(newModel, nameOfTheParent, false);
                Visual.isDependenciesVisible = false;
            }
            else {
                newModel = calculationsForDrawing.makingVisibleAndInVisibleHeir(newModel, nameOfTheParent, true);
                Visual.isDependenciesVisible = true;
            }
            calculationsForDrawing.findLevelsThatIsVisible(newModel);
            calculationsForDrawing.numberOfElementsOnEachLevelThatIsVisible(newModel);
            newModel = calculationsForDrawing.calculationOfWeightingCoefficients(newModel);
            let heightOfTheShape = this.drawingElements(options, newModel, listTeams, numberOfVisibleLevels);
            this.drawingRelationships(newModel, heightOfTheShape);
            let drawControlPanel: DrawControlPanel = new DrawControlPanel();
            drawControlPanel.drawingControlPanel(options, newModel, listTeams, heightOfTheShape, numberOfVisibleLevels);
        }

        public drawingRelationships(options: ViewModel, heightOfTheShape: number) {

            let newModel: ViewModel = options;
            let elementsOfTheCurrentLevel = 0;
            let elementsOfTheNextLevel = elementsOfTheCurrentLevel + 1;
            let mainCommunicationElementName;
            let xConnectionCoordinate;
            let yConnectionCoordinate;

            while (elementsOfTheCurrentLevel <= Visual.numberOfLevelsThatIsVisible) {
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if ((newModel.dataPoints[i].lvl === elementsOfTheCurrentLevel) && (newModel.dataPoints[i].isVisible)) {
                        mainCommunicationElementName = newModel.dataPoints[i].id;
                        xConnectionCoordinate = newModel.dataPoints[i].xCoordinate;
                        yConnectionCoordinate = newModel.dataPoints[i].yCoordinate;

                        for (let j = 0; j < newModel.dataPoints.length; j++) {
                            if ((newModel.dataPoints[j].lvl === elementsOfTheNextLevel) && (newModel.dataPoints[j].reportTo === mainCommunicationElementName) && (newModel.dataPoints[j].isVisible)) {

                                Visual.connection = Visual.barGroup.append("line")
                                    .classed('connection', true);

                                Visual.connection
                                    .style("stroke", Visual.linksColor)
                                    .attr("x1", xConnectionCoordinate)
                                    .attr("y1", yConnectionCoordinate + 6)
                                    .attr("x2", newModel.dataPoints[j].xCoordinate)
                                    .attr("y2", (newModel.dataPoints[j].yCoordinate - heightOfTheShape));
                            }
                        }
                    }
                }
                elementsOfTheCurrentLevel = elementsOfTheCurrentLevel + 1;
                elementsOfTheNextLevel = elementsOfTheNextLevel + 1;
            }
        }

        public static deletingOldShapes() {
            Visual.barGroup
                .selectAll(".rectangle")
                .remove();

            Visual.barGroup
                .selectAll(".nameTextValue")
                .remove();

            Visual.barGroup
                .selectAll(".surnameTextValue")
                .remove();

            Visual.barGroup
                .selectAll(".connection")
                .remove();
            Visual.barGroup
                .selectAll(".circle")
                .remove();
            Visual.barGroup
                .selectAll(".imageScroll")
                .remove();

            Visual.barGroup
                .selectAll(".warningSign")
                .remove();
        }
    }

    class CalculationsForDrawing {

        public calculationOfWeightingCoefficients(newModel: ViewModel) {
            let currentWeight = 1;
            let currentLevel = Visual.numberOfLevelsThatIsVisible - 1;
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {
                    newModel.dataPoints[i].elementWeight = currentWeight;
                }
            }
            currentLevel--;
            while (currentLevel >= 0) {
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {
                        currentWeight = this.countingTheWeightCurrentElement(newModel, currentLevel, i);
                        newModel.dataPoints[i].elementWeight = currentWeight;
                        if (currentLevel == 0) {
                            Visual.maximumElementWeight = currentWeight
                        }
                    }
                }
                currentLevel--;
            }
            return newModel;
        }

        public countingTheWeightCurrentElement(newModel: ViewModel, currentLevel, i): number {

            let currentWeight = 0;
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                if ((newModel.dataPoints[j].lvl === currentLevel + 1) && (newModel.dataPoints[j].isVisible) && (newModel.dataPoints[i].id === newModel.dataPoints[j].reportTo)) {
                    currentWeight = currentWeight + newModel.dataPoints[j].elementWeight;
                }
            }
            if (currentWeight == 0) {
                currentWeight = 1;
            }
            return currentWeight;
        }

        public definitionOfTheSmallestValue(firstValue, secondValue): number {
            if (firstValue < secondValue) {
                return firstValue;
            }
            else {
                return secondValue;
            }
        }

        public definitionOfTheLargerValue(firstValue, secondValue): boolean {
            if (firstValue > secondValue) {
                return true;
            }
            else {
                return false;
            }
        }

        public calculatingTheWidthOfShape(widthOfTheWindow, Weight): number {
            let widthOfTheShape: number = widthOfTheWindow / (Weight * 1.2);
            return widthOfTheShape;
        }

        public calculatingTheHeightOfShape(heightOfTheWindow): number {
            let maxNumberOfTheLevel = Visual.numberOfElementsAtTheLevelThatIsVisible.length;
            let heightOfTheShape: number = heightOfTheWindow / (maxNumberOfTheLevel * 1.3);
            return heightOfTheShape;
        }

        public searchMaximumNumberOfElementsAtTheLevel(): number {
            let max = 0;
            for (let i = 0; i < Visual.numberOfElementsAtTheLevelThatIsVisible.length; i++) {
                if (Visual.numberOfElementsAtTheLevelThatIsVisible[i] > max) {
                    max = Visual.numberOfElementsAtTheLevelThatIsVisible[i];
                }
            }
            return max;
        }

        public calculationOfTheCoordinateX(xCenterCoordinate, gapWidth): number {
            xCenterCoordinate = xCenterCoordinate + (gapWidth * 2);
            return xCenterCoordinate;
        }

        public colorDefinitionByCommand(newModel: ViewModel, index, listTeams: TeamModelList): string {
            let color;
            for (let i = 0; i < listTeams.teamModel.length; i++) {
                if (newModel.dataPoints[index].team === listTeams.teamModel[i].team) {
                    color = listTeams.teamModel[i].color;
                }
            }
            return color;
        }

        public makingVisibleLevels(newModel, startLevel, endLevel): ViewModel {
            let currentLevel = startLevel;
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                newModel.dataPoints[i].isVisible = false;
            }
            while (currentLevel <= endLevel + 1) {
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if (newModel.dataPoints[i].lvl === currentLevel) {
                        newModel.dataPoints[i].isVisible = true;
                    }
                }
                currentLevel++;
            }
            return newModel;
        }

        public numberOfElementsOnEachLevelThatIsVisible(newModel: ViewModel) {
            Visual.numberOfElementsAtTheLevelThatIsVisible = new Array();

            for (let i = 0; i < Visual.numberOfLevelsThatIsVisible + 1; i++) {
                Visual.numberOfElementsAtTheLevelThatIsVisible.push(0);
            }
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                if (newModel.dataPoints[j].isVisible) {
                    let levelOfTheCurrentItem = 0;
                    let temp = 0;
                    levelOfTheCurrentItem = newModel.dataPoints[j].lvl;
                    temp = Visual.numberOfElementsAtTheLevelThatIsVisible[levelOfTheCurrentItem];
                    Visual.numberOfElementsAtTheLevelThatIsVisible[levelOfTheCurrentItem] = temp + 1;
                }
            }
        }

        public findLevelsThatIsVisible(newModel: ViewModel) {
            let currentLevel = 0;
            let previousLevel = -1;
            Visual.isExternalEventClick = false;
            while (previousLevel != currentLevel) {
                if (currentLevel > Visual.numberOfLevels - 1)
                { break; }
                for (let i = 0, len = newModel.dataPoints.length; i < len; i++) {
                    if (newModel.dataPoints[i].highlighted) { Visual.isExternalEventClick = true; }
                    previousLevel = currentLevel;
                    if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {
                        currentLevel++;
                    }
                }
            }
            Visual.numberOfLevelsThatIsVisible = currentLevel;
        }

        public searchOfHeirs(newModel: ViewModel) {
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                for (let j = 0; j < newModel.dataPoints.length; j++) {
                    if (newModel.dataPoints[i].id === newModel.dataPoints[j].reportTo) {
                        newModel.dataPoints[i].isHeirs = true;
                        break;
                    }
                }
            }
            return newModel;
        }

        public makingVisibleAndInVisibleHeir(newModel: ViewModel, nameOfTheParent, isVisible): ViewModel {

            let listNames = new Array();
            listNames.push(nameOfTheParent);
            do {
                nameOfTheParent = listNames[0];
                listNames.splice(0, 1);
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if (newModel.dataPoints[i].reportTo === nameOfTheParent) {
                        if (!isVisible) {
                            listNames.push(newModel.dataPoints[i].id);
                        }
                        if (newModel.dataPoints[i].lvl < Visual.numberOfLevels + 1) {
                            newModel.dataPoints[i].isVisible = isVisible;
                        }

                    }
                }
            }
            while (listNames.length != 0);
            return newModel;
        }

        public nameDeterminationByCoordinates(newModel, xCenterCoordinate, yCenterCoordinate): string {
            let nameOfTheParent = "";
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                if ((xCenterCoordinate == newModel.dataPoints[i].xCoordinate) && (yCenterCoordinate == newModel.dataPoints[i].yCoordinate)) {
                    nameOfTheParent = newModel.dataPoints[i].id;
                }
            }
            return nameOfTheParent;
        }

        public numberOfElementsOnEachLevel(newModel) {
            Visual.numberOfElementsAtTheLevel = new Array();

            for (let i = 0; i < Visual.numberOfLevels; i++) {
                Visual.numberOfElementsAtTheLevel.push(0);
            }
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                let levelOfTheCurrentItem = 0;
                let temp = 0;
                levelOfTheCurrentItem = newModel.dataPoints[j].lvl;
                temp = Visual.numberOfElementsAtTheLevel[levelOfTheCurrentItem];
                Visual.numberOfElementsAtTheLevel[levelOfTheCurrentItem] = temp + 1;
            }
        }

        public findLevels(cashModel: ViewModel): ViewModel {

            let lvlTop: DataPoint;
            let lvlUp: DataPoint = {
                id: "lvlUp",
                title: "lvlUp",
                reportTo: "lvlUp",
                lvl: -1,
                xCoordinate: 0,
                yCoordinate: 0,
                isVisible: false,
                team: "",
                position: "",
                selectionId: undefined,
                teamId: 0,
                highlighted: false,
                isHeirs: false,
                elementWeight: 0,
                parentStartX: 0
            };
            let cashPoint: DataPoint;
            let sortModel: ViewModel = {
                dataPoints: [],
                teamSet: {},
                highlights: false
            };
            let _lvl: number = 0;
            let newViewModel: ViewModel = {
                dataPoints: [],
                teamSet: {},
                highlights: false
            };

            for (let i = 0, len = cashModel.dataPoints.length; i < len; i++) {

                let searchTopRank: string = cashModel.dataPoints[i].reportTo;
                if (searchTopRank == null || searchTopRank == "" || searchTopRank == " ") {
                    cashModel.dataPoints[i].lvl = _lvl;
                    newViewModel.dataPoints.push(cashModel.dataPoints[i]);
                    sortModel.dataPoints.push(cashModel.dataPoints[i]);
                    _lvl++;
                    cashPoint = cashModel.dataPoints[i];
                    break;
                }
            }
            newViewModel.dataPoints.push(lvlUp);

            do {
                for (let i = 0; i < cashModel.dataPoints.length; i++) {

                    if (cashModel.dataPoints[i].reportTo == newViewModel.dataPoints[0].id) {

                        cashModel.dataPoints[i].lvl = _lvl;
                        newViewModel.dataPoints.push(cashModel.dataPoints[i]);
                        sortModel.dataPoints.push(cashModel.dataPoints[i]);
                    }
                }
                newViewModel.dataPoints.splice(0, 1);

                if (newViewModel.dataPoints[0].reportTo && newViewModel.dataPoints[0].id == "lvlUp") {
                    _lvl++;
                    newViewModel.dataPoints.splice(0, 1);
                    newViewModel.dataPoints.push(lvlUp);
                }
            }
            while (newViewModel.dataPoints.length != 1);

            Visual.numberOfLevels = _lvl - 1;
            return sortModel;
        }
    }

    class WorkWithTeams {
        public joiningCommandsWithColors(modelWithVisibleElements, viewModel: ViewModel) {
            let listTeams = this.countingTheNumberOfTeams(modelWithVisibleElements, viewModel);

            for (let i = 0; i < listTeams.teamModel.length; i++) {
                listTeams.teamModel[i].color = viewModel.teamSet[listTeams.teamModel[i].team].color;
            }

            return listTeams;
        }

        public joiningPersonsWithTeamId(team, teamList: TeamModelList): number {
            let teamId = -1;
            for (let i = 0; i < teamList.teamModel.length; i++) {
                if (teamList.teamModel[i].team === team) {
                    teamId = teamList.teamModel[i].teamId;
                    break;
                }
            }
            return teamId;
        }

        public countingTheNumberOfTeams(newModel: ViewModel, previousModel: ViewModel): TeamModelList {
            let teamModelList: TeamModelList = {
                teamModel: []
            };
            let counter = 0;
            let isUniqueTeam;
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                isUniqueTeam = true;
                for (let j = 0; j < teamModelList.teamModel.length; j++) {
                    if (newModel.dataPoints[i].team === teamModelList.teamModel[j].team) {
                        isUniqueTeam = false;
                        break;
                    }
                }
                if (isUniqueTeam) {
                    const teamName: string = newModel.dataPoints[i].team;

                    let team: TeamModel = {
                        team: newModel.dataPoints[i].team,
                        color: "yellow",
                        teamId: counter,
                        selectionIds: previousModel.teamSet[teamName].selectionIds || []
                    };
                    counter++;
                    teamModelList.teamModel.push(team);
                }
            }
            return teamModelList;
        }
    }

    class WorkWithWarning {
        public handlingOfWarnings(viewModel: ViewModel, modelWithLevels: ViewModel) {
            Visual.isWarning = true;
            let modelProblemElements: ViewModel = {
                dataPoints: [],
                teamSet: {},
                highlights: false
            };
            modelProblemElements = this.searchForErroneousElements(viewModel, modelWithLevels, modelProblemElements);
            this.definitionOfSelfCycling(modelProblemElements, viewModel);
        }

        public searchForErroneousElements(viewModel: ViewModel, modelWithLevels: ViewModel, modelProblemElements: ViewModel) {
            modelProblemElements.dataPoints = viewModel.dataPoints.filter(function (obj) { return modelWithLevels.dataPoints.indexOf(obj) == -1; });
            return modelProblemElements;
        }

        public definitionOfSelfCycling(modelProblemElements: ViewModel, viewModel: ViewModel) {
            Visual.errorList = new Array();
            let orphan = true;
            Visual.errorList[0] = "";
            Visual.errorList[2] = "";
            Visual.errorList[4] = "";
            Visual.errorList[6] = "";

            for (let i = 0; i < modelProblemElements.dataPoints.length; i++) {
                if (modelProblemElements.dataPoints[i].id == "notFound") {
                    Visual.errorList[0] = "do not have id";
                }
                if (modelProblemElements.dataPoints[i].id == modelProblemElements.dataPoints[i].reportTo) {
                    Visual.errorList[2] = Visual.errorList[2] + " " + modelProblemElements.dataPoints[i].id;
                }
                else {
                    for (let j = 0; j < viewModel.dataPoints.length; j++) {
                        if (modelProblemElements.dataPoints[i].reportTo == viewModel.dataPoints[j].id) {
                            orphan = false;
                        }
                    }
                    if (orphan) {
                        Visual.errorList[4] = Visual.errorList[4] + " " + modelProblemElements.dataPoints[i].id;
                    } else {
                        Visual.errorList[6] = Visual.errorList[6] + " " + modelProblemElements.dataPoints[i].id;
                    }
                }
                orphan = true;
            }
            Visual.errorList[1] = "";
            Visual.errorList[3] = "are looped on each other";
            Visual.errorList[5] = "have non-existing id";
            Visual.errorList[7] = "are not associated with the main tree ";
        }
    }

    class DrawWarning {
        public drawingWarningSign(options: VisualUpdateOptions) {
            Visual.warningSign = Visual.barGroup.append("text")
                .classed("warningSign", true);

            Visual.warningSign
                .text("!")
                .attr({
                    x: 10,
                    y: 10,
                    dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", 40 + "px")
                .style("text-align", "left")
                .on('mouseenter', () => {
                    this.drawingWarningWindow(options);
                })
                .on('mouseleave', () => {
                    Visual.barGroup
                        .selectAll(".warningWindow")
                        .remove();
                    Visual.barGroup
                        .selectAll(".warningText")
                        .remove();
                })
        }

        public drawingWarningWindow(options: VisualUpdateOptions) {
            let yCoordinate = 25;
            let widthWindow = 210;
            let text;
            Visual.warningWindow = Visual.barGroup.append("rect")
                .classed('warningWindow', true);
            if (Visual.visualWindowWidth < 280) {
                widthWindow = Visual.visualWindowWidth - 50;
            }

            for (let i = 0; i < Visual.errorList.length; i = i + 2) {
                if (Visual.errorList[i].length != 0) {
                    text = "- Items ";
                    let k = 0;
                    let error = Visual.errorList[i].split(' ');
                    for (let j = 0; j < error.length; j++) {
                        text = text + " " + error[j];
                        k++;
                        if (k > 9) {
                            this.drawingWarningText(options, text, yCoordinate);
                            yCoordinate = yCoordinate + 15;
                            k = 0;
                            text = " ";
                        }
                    }
                    if (k != 0) {
                        this.drawingWarningText(options, text, yCoordinate);
                    }
                    yCoordinate = yCoordinate + 15;
                    text = Visual.errorList[i + 1];
                    if (text != "") {
                        this.drawingWarningText(options, text, yCoordinate);
                        yCoordinate = yCoordinate + 15;
                    }
                }
            }
            Visual.warningWindow
                .style("fill", " #FFFACD")
                .style("stroke", "black")
                .style("stroke-width", 2)
                .attr({
                    rx: 6,
                    x: 50,
                    y: 10,
                    width: widthWindow,
                    height: yCoordinate - 10
                })
        }

        public drawingWarningText(options: VisualUpdateOptions, error, yCoordinate) {
            Visual.warningText = Visual.barGroup.append("text")
                .classed('warningText', true);

            Visual.warningText
                .text(error)
                .attr({
                    x: 55,
                    y: yCoordinate
                }).style("font-size", 12 + "px")
                .style("text-align", "left")
        }
    }
}
