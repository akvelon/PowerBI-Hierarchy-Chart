module powerbi.extensibility.visual {

    interface DataPoint {
        name: string;
        reportTo: string;
        lvl: number;
        xCoordinate: number;
        yCoordinate: number;
        isVisible: boolean;
        team: string;
        position: string;
    };

    interface ViewModel {
        dataPoints: DataPoint[];
    };

    interface TeamModel {
        team: string;
        color: string;
    };

    interface TeamModelList {
        teamModel: TeamModel[];
    };

    interface ColumnIndex {
        category?: number;
        reportTo?: number;
        level?: number;
        xCoordinate?: number;
        yCoordinate?: number;
        isVisible: boolean;
        team?: string;
        position?: string;
    }

    export class Visual implements IVisual {

        public host: IVisualHost;
        public static svg: d3.Selection<SVGElement>;
        public static barGroup: d3.Selection<SVGElement>;
        public static rectangle: d3.Selection<SVGElement>;
        public static nameTextValue: d3.Selection<SVGElement>;
        public static surnameTextValue: d3.Selection<SVGElement>;
        public static connection: d3.Selection<SVGElement>;
        public static circle: d3.Selection<SVGElement>;
        public static numberOfLevels: number;
        public static numberOfLevelsThatIsVisible: number;
        public static numberOfElementsAtTheLevel: number[];
        public static numberOfElementsAtTheLevelThatIsVisible: number[];
        public static isDependenciesVisible: boolean = false;

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            Visual.svg = d3.select(options.element)
                .append("svg")
                .classed("my-little-bar-chart", true);
            Visual.barGroup = Visual.svg.append("g")
                .classed("bar-group", true);
        }

        public update(options: VisualUpdateOptions) {
            let viewModel = this.getViewModel(options);

            let drawElements: DrawElements = new DrawElements();
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let drawControlPanel: DrawControlPanel = new DrawControlPanel();
            let workWithTeams: WorkWithTeams = new WorkWithTeams();

            let modelWithLevels = calculationsForDrawing.findLevels(viewModel);
            calculationsForDrawing.numberOfElementsOnEachLevel(modelWithLevels);

            DrawElements.deletingOldShapes();
            
            let numberOfVisibleLevels = Visual.numberOfLevels;
            let modelWithVisibleElements = calculationsForDrawing.makingVisibleLevels(modelWithLevels, 0, numberOfVisibleLevels);
            calculationsForDrawing.findLevelsThatIsVisible(modelWithVisibleElements);
            calculationsForDrawing.numberOfElementsOnEachLevelThatIsVisible(modelWithVisibleElements);

            let listTeams = workWithTeams.joiningCommandsWithColors(modelWithVisibleElements);

            let heightOfTheShape = drawElements.drawingElements(options, modelWithVisibleElements, listTeams, numberOfVisibleLevels);
            drawElements.drawingRelationships(modelWithVisibleElements, heightOfTheShape);
            drawControlPanel.drawingControlPanel(options, modelWithVisibleElements, listTeams, heightOfTheShape, numberOfVisibleLevels);
        }

        private getViewModel(options: VisualUpdateOptions): ViewModel {

            let dataViews: DataView[] = options.dataViews;
            let viewModel: ViewModel = {
                dataPoints: []
            };

            if (!dataViews
                || !dataViews[0]
                || !dataViews[0].table
                || !dataViews[0].table.rows
            ) { return viewModel; }

            const dataView: DataView = dataViews[0];

            const columnIndexes: ColumnIndex = {
                category: -1,
                reportTo: -1,
                level: 0,
                xCoordinate: 0,
                yCoordinate: 0,
                isVisible: false,
                team: "",
                position: ""
            };

            dataView.table.columns.forEach((column: DataViewMetadataColumn, columnIndex: number) => {
                Object.keys(column.roles).forEach((roleName: string) => {
                    columnIndexes[roleName] = columnIndex;
                });
            });

            viewModel.dataPoints = dataView.table.rows.map((row: DataViewTableRow) => {
                const name: string = row[columnIndexes.category] as string;
                const reportTo: string = row[columnIndexes.reportTo] as string;
                const lvl: number = 0 as number;
                const xCoordinate: number = 0 as number;
                const yCoordinate: number = 0 as number;
                const isVisible: boolean = false as boolean;
                const team: string = row[columnIndexes.team] as string;
                const position: string = row[columnIndexes.position] as string;

                return {
                    name,
                    reportTo: reportTo || " ",
                    lvl,
                    xCoordinate,
                    yCoordinate,
                    isVisible,
                    team,
                    position
                };
            });
            return viewModel;
        }
    }

    class DrawControlPanel {
        
        public drawingControlPanel(options: VisualUpdateOptions, newModel: ViewModel, listTeams: TeamModelList, heightOfTheShape, numberOfVisibleLevels) {
            this.drawingControlButtons(options, heightOfTheShape, newModel, numberOfVisibleLevels, listTeams);
            this.drawingMarks(options, listTeams, heightOfTheShape);
        }

        public drawingControlButtons(options: VisualUpdateOptions, heightOfTheShape, newModel: ViewModel, numberOfVisibleLevels, listTeams: TeamModelList) {
            let windowWidth = options.viewport.width;
            let screenCenterCoordinates = windowWidth / 2;
            let shearSize = screenCenterCoordinates / 4;
            let xButtonCoordinateAdd = screenCenterCoordinates - shearSize;
            let xButtonCoordinateMinus = screenCenterCoordinates + shearSize;
            let yButtonCoordinate = options.viewport.width / 50;

            this.drowingButton(options, heightOfTheShape / 5, xButtonCoordinateAdd, newModel, numberOfVisibleLevels, listTeams, true, "+");
            this.drowingButton(options, heightOfTheShape / 5, xButtonCoordinateMinus, newModel, numberOfVisibleLevels, listTeams, false, "-");
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
                .style("font-family", "cursive")
                .style("text-align", "left")
                .on('click', () => { this.clickButtonEvent(newModel, options, numberOfVisibleLevels, listTeams, isChangeLevel); })
        }

        public clickButtonEvent(newModel: ViewModel, options: VisualUpdateOptions, numberOfVisibleLevels, listTeams: TeamModelList, isChangeLevel) {
            DrawElements.deletingOldShapes();
            if (isChangeLevel) {
                if (numberOfVisibleLevels < Visual.numberOfLevels) {
                    numberOfVisibleLevels = numberOfVisibleLevels + 1;
                }
            }
            else {
                if (numberOfVisibleLevels > 1) {
                    numberOfVisibleLevels = numberOfVisibleLevels - 1;
                }
            }
            let drawElements: DrawElements = new DrawElements();
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let modelWithVisibleElements = calculationsForDrawing.makingVisibleLevels(newModel, 0, numberOfVisibleLevels);
            calculationsForDrawing.findLevelsThatIsVisible(modelWithVisibleElements);
            calculationsForDrawing.numberOfElementsOnEachLevelThatIsVisible(modelWithVisibleElements);
            let heightOfTheShape = drawElements.drawingElements(options, modelWithVisibleElements, listTeams, numberOfVisibleLevels);
            drawElements.drawingRelationships(modelWithVisibleElements, heightOfTheShape);
            this.drawingControlPanel(options, modelWithVisibleElements, listTeams, heightOfTheShape, numberOfVisibleLevels);
        }

        public drawingMarks(options: VisualUpdateOptions, listTeams: TeamModelList, heightOfTheShape) {
           
            let radius = heightOfTheShape / (listTeams.teamModel.length * 1.5);
            let widthWindow = options.viewport.width;
            let xCircleCoordinate = radius*1.2;
            let yCircleCoordinate = radius*1.2;
            let yCircleCoordinateForTheSecondHalf = radius*1.2;
            let xTextCoordinate = radius + widthWindow/8; 

            for (let i = 0; i < listTeams.teamModel.length; i++) {
                let color = listTeams.teamModel[i].color;
                if (i < (listTeams.teamModel.length / 2)) {
                    this.drawingColorMarks(options, xCircleCoordinate, yCircleCoordinate, radius, color);
                    this.drawingTextMarks(options, xTextCoordinate, yCircleCoordinate, listTeams.teamModel[i].team, radius);
                    yCircleCoordinate = yCircleCoordinate + radius * 2.5;
                }
                else {
                    xCircleCoordinate = widthWindow - radius*1.2;
                    this.drawingColorMarks(options, xCircleCoordinate, yCircleCoordinateForTheSecondHalf, radius, color);
                    this.drawingTextMarks(options, xCircleCoordinate - widthWindow/8, yCircleCoordinateForTheSecondHalf, listTeams.teamModel[i].team, radius);
                    yCircleCoordinateForTheSecondHalf = yCircleCoordinateForTheSecondHalf + radius * 2.5;
                }
            }
        }

        public drawingColorMarks(options: VisualUpdateOptions, xCircleCoordinate, yCircleCoordinate, radius, color) {

            Visual.circle = Visual.barGroup.append("circle")
                .classed('circle', true);

            Visual.circle
                .style("fill", color)
                .style("fill-opacity", 0.5)
                .style("stroke", "black")
                .style("stroke-width", 1)
                .attr({
                    r: radius,
                    cx: xCircleCoordinate,
                    cy: yCircleCoordinate
                })
        }

        public drawingTextMarks(options: VisualUpdateOptions, xCircleCoordinate, yCircleCoordinate, team, radius) {
            
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            CalculationsForDrawing
            let fontSize = calculationsForDrawing.definitionOfTheSmallestValue(radius * 2.5, options.viewport.width/60);

            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true);

            Visual.nameTextValue
                .text(team)
                .attr({
                    x: xCircleCoordinate ,
                    y: yCircleCoordinate,
                    dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", fontSize + "px")
                .style("font-family", "cursive")
                .style("text-align", "left")
        }
    } 



    class DrawElements {

        public drawingElements(options: VisualUpdateOptions, newModel: ViewModel, listTeams: TeamModelList, numberOfVisibleLevels): number {
            let widthOfTheWindow = options.viewport.width;
            let heightOfTheWindow = options.viewport.height;
            Visual.svg.attr({
                width: widthOfTheWindow,
                height: heightOfTheWindow
            });
            let widthOfTheShape = 0;
            let heightOfTheShape = 0;

            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            heightOfTheShape = calculationsForDrawing.calculatingTheHeightOfShape(heightOfTheWindow);
            heightOfTheShape = calculationsForDrawing.definitionOfTheSmallestValue(heightOfTheShape, heightOfTheWindow/5)
            widthOfTheShape = calculationsForDrawing.calculatingTheWidthOfShape(widthOfTheWindow);
            widthOfTheShape = calculationsForDrawing.definitionOfTheSmallestValue(widthOfTheShape, widthOfTheWindow/5)
            let isHeightGreaterThanWidth = calculationsForDrawing.definitionOfTheLargerValue(heightOfTheShape, widthOfTheShape);

            let fontSizeValue: number = heightOfTheShape / 7;

            let xCenterCoordinate = 0;
            let yCenterCoordinate = heightOfTheShape + (heightOfTheShape / 10);
            let gapWidth = 0;
            let gapHeight = heightOfTheShape / 1.3;

            let currentLevel = 0;
            while (currentLevel <= Visual.numberOfLevelsThatIsVisible) {
                let isTheFirstElementOfTheSeries = true;
                gapWidth = (widthOfTheWindow / 2) / Visual.numberOfElementsAtTheLevelThatIsVisible[currentLevel];

                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {

                        if (isTheFirstElementOfTheSeries) {
                            xCenterCoordinate = xCenterCoordinate + gapWidth;
                            isTheFirstElementOfTheSeries = false;
                        }
                        else {
                            xCenterCoordinate = calculationsForDrawing.calculationOfTheCoordinateX(xCenterCoordinate, gapWidth);
                        }

                        let color = calculationsForDrawing.colorDefinitionByCommand(newModel, i, listTeams);

                        this.drawingRectangle(xCenterCoordinate, yCenterCoordinate, heightOfTheShape, widthOfTheShape, newModel, options, listTeams, color, numberOfVisibleLevels, newModel.dataPoints[i].lvl);
                        let offsetValue = fontSizeValue / 2;
                        let tempName = newModel.dataPoints[i].name.split(" ");
                        this.drawingName(xCenterCoordinate, yCenterCoordinate, tempName, newModel, options, i, fontSizeValue, offsetValue, listTeams, numberOfVisibleLevels, newModel.dataPoints[i].lvl, isHeightGreaterThanWidth);
                        this.drawingSurname(xCenterCoordinate, yCenterCoordinate, tempName, newModel, options, i, fontSizeValue, offsetValue, listTeams, numberOfVisibleLevels, newModel.dataPoints[i].lvl, isHeightGreaterThanWidth);

                        newModel.dataPoints[i].xCoordinate = xCenterCoordinate;
                        newModel.dataPoints[i].yCoordinate = yCenterCoordinate;
                    }
                }
                isTheFirstElementOfTheSeries = true;
                xCenterCoordinate = 0;
                yCenterCoordinate = yCenterCoordinate + gapHeight * 2;
                currentLevel++;
            }
            return heightOfTheShape;
        }


        public drawingRectangle(xCenterCoordinate, yCenterCoordinate, heightOfTheShape, widthOfTheShape, newModel, options, listTeams: TeamModelList, color, numberOfVisibleLevels, lvl) {
            let tempxCenterCoordinate = xCenterCoordinate;
            let tempyCenterCoordinate = yCenterCoordinate;

            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            Visual.rectangle = Visual.barGroup.append("rect")
                .classed('rectangle', true);
            Visual.rectangle
                .style("fill", color)
                .style("fill-opacity", 0.5)
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
                        this.clickEvent(newModel, options, nameOfTheParent, listTeams, numberOfVisibleLevels);
                    }
                })
        }

        public drawingName(xCenterCoordinate, yCenterCoordinate, tempName, newModel, options, i, fontSizeValue, offsetValue, listTeams: TeamModelList, numberOfVisibleLevels, lvl, isHeightGreaterThanWidth) {
            let writingMode;
            let xCoordinate;
            let yCoordinate;
            if(isHeightGreaterThanWidth){
                writingMode = "tb";
                xCoordinate = xCenterCoordinate + offsetValue;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3.5;
            }
            else{
                writingMode = "bt";
                xCoordinate = xCenterCoordinate;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3.5 - offsetValue;
            }
            Visual.nameTextValue = Visual.barGroup.append("text")
                .classed("nameTextValue", true);

            Visual.nameTextValue
                .text(tempName[0])
                .attr({
                    x: xCoordinate,
                    y: yCoordinate,
                    dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", fontSizeValue + "px")
                .style("writing-mode", writingMode)
                .style("font-family", "cursive")
                .on('click', () => {
                    if (lvl != 0)
                    { this.clickEvent(newModel, options, newModel.dataPoints[i].name, listTeams, numberOfVisibleLevels); }
                });
        }

        public drawingSurname(xCenterCoordinate, yCenterCoordinate, tempName, newModel: ViewModel, options, i, fontSizeValue, offsetValue, listTeams: TeamModelList, numberOfVisibleLevels, lvl, isHeightGreaterThanWidth) {
            let writingMode;
            let xCoordinate;
            let yCoordinate;
            if(isHeightGreaterThanWidth){
                writingMode = "tb";
                xCoordinate = xCenterCoordinate - offsetValue;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3.5;
            }
            else{
                writingMode = "bt";
                xCoordinate = xCenterCoordinate ;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3.5 + offsetValue;
            }
            Visual.surnameTextValue = Visual.barGroup.append("text")
                .classed("surnameTextValue", true);
            let textValue = "";
            for (let i = 1; i < tempName.length; i++) {
                textValue = textValue + " " + tempName[i];
            }
            Visual.surnameTextValue
                .text(textValue + ", " + newModel.dataPoints[i].position)
                .attr({
                    x: xCoordinate,
                    y: yCoordinate,
                    dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", fontSizeValue / 1.5 + "px")
                .style("writing-mode", writingMode)
                .style("font-family", "cursive")
                .on('click', () => {
                    if (lvl != 0)
                    { this.clickEvent(newModel, options, newModel.dataPoints[i].name, listTeams, numberOfVisibleLevels); }
                });
        }

        public clickEvent(newModel: ViewModel, options: VisualUpdateOptions, nameOfTheParent, listTeams: TeamModelList, numberOfVisibleLevels) {
            DrawElements.deletingOldShapes();

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
                        mainCommunicationElementName = newModel.dataPoints[i].name;
                        xConnectionCoordinate = newModel.dataPoints[i].xCoordinate;
                        yConnectionCoordinate = newModel.dataPoints[i].yCoordinate;

                        for (let j = 0; j < newModel.dataPoints.length; j++) {
                            if ((newModel.dataPoints[j].lvl === elementsOfTheNextLevel) && (newModel.dataPoints[j].reportTo === mainCommunicationElementName) && (newModel.dataPoints[j].isVisible)) {

                                Visual.connection = Visual.barGroup.append("line")
                                    .classed('connection', true);

                                Visual.connection
                                    .style("stroke", "black")
                                    .attr("x1", xConnectionCoordinate)
                                    .attr("y1", yConnectionCoordinate)
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
        }
    }

    class CalculationsForDrawing {

        public definitionOfTheSmallestValue(firstValue, secondValue): number
        {
            if(firstValue<secondValue){
                return firstValue;
            }
            else{
                return secondValue;
            }
        }

        public definitionOfTheLargerValue(firstValue, secondValue): boolean
        {
            if(firstValue>secondValue){
                return true;
            }
            else{
                return false;
            }
        }

        public calculatingTheWidthOfShape(widthOfTheWindow): number {
            let maxNumberOfElementsAtTheLevel = this.searchMaximumNumberOfElementsAtTheLevel();
            let widthOfTheShape: number = widthOfTheWindow / (maxNumberOfElementsAtTheLevel * 1.2);
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
            while (currentLevel <= endLevel) {
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
            while (previousLevel != currentLevel) {
                if (currentLevel > Visual.numberOfLevels)
                { break; }
                for (let i = 0, len = newModel.dataPoints.length; i < len; i++) {
                    previousLevel = currentLevel;
                    if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {
                        currentLevel++;
                    }
                }
            }
            Visual.numberOfLevelsThatIsVisible = currentLevel;
        }

        public makingVisibleAndInVisibleHeir(newModel: ViewModel, nameOfTheParent, isVisible): ViewModel {

            let listNames = new Array();
            listNames.push(nameOfTheParent);
            do {
                nameOfTheParent = listNames[0];
                listNames.splice(0, 1);
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                     if (newModel.dataPoints[i].reportTo === nameOfTheParent)
                     {
                        if (!isVisible) {
                            listNames.push(newModel.dataPoints[i].name);
                        }
                        newModel.dataPoints[i].isVisible = isVisible;
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
                    nameOfTheParent = newModel.dataPoints[i].name;
                }
            }
            return nameOfTheParent;
        }

        public numberOfElementsOnEachLevel(newModel) {
            Visual.numberOfElementsAtTheLevel = new Array();

            for (let i = 0; i < Visual.numberOfLevels + 1; i++) {
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
                name: "lvlUp",
                reportTo: "lvlUp",
                lvl: -1,
                xCoordinate: 0,
                yCoordinate: 0,
                isVisible: false,
                team: "",
                position: ""
            };
            let cashPoint: DataPoint;
            let sortModel: ViewModel = {
                dataPoints: []
            };
            let _lvl: number = 0;
            let newViewModel: ViewModel = {
                dataPoints: []
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

                    if (cashModel.dataPoints[i].reportTo == newViewModel.dataPoints[0].name) {

                        cashModel.dataPoints[i].lvl = _lvl;
                        newViewModel.dataPoints.push(cashModel.dataPoints[i]);
                        sortModel.dataPoints.push(cashModel.dataPoints[i]);
                    }
                }
                newViewModel.dataPoints.splice(0, 1);

                if (newViewModel.dataPoints[0].name == "lvlUp") {
                    _lvl++;
                    newViewModel.dataPoints.splice(0, 1);
                    newViewModel.dataPoints.push(lvlUp);
                }
            }
            while (newViewModel.dataPoints.length != 1);
            Visual.numberOfLevels = _lvl - 2;
            return sortModel;
        }

    }

    class WorkWithTeams {
        public joiningCommandsWithColors(modelWithVisibleElements) {
            let listTeams = this.countingTheNumberOfTeams(modelWithVisibleElements);
            /*
            //Dynamic color change
            for (let i = 0; i < listTeams.teamModel.length; i++) {
                listTeams.teamModel[i].color = "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + ","
                    + Math.floor(Math.random() * 255) + ")";
            }
            */
            //Static color change
            for (let i = 0; i < listTeams.teamModel.length; i++) {
                listTeams.teamModel[i].color = this.rainbow(listTeams.teamModel.length, i);
            }
            return listTeams;
        }

        public rainbow(numOfSteps, step) {
            var r, g, b;
            var h = step / numOfSteps;
            var i = ~~(h * 6);
            var f = h * 6 - i;
            var q = 1 - f;
            switch (i % 6) {
                case 0: r = 1; g = f; b = 0; break;
                case 1: r = q; g = 1; b = 0; break;
                case 2: r = 0; g = 1; b = f; break;
                case 3: r = 0; g = q; b = 1; break;
                case 4: r = f; g = 0; b = 1; break;
                case 5: r = 1; g = 0; b = q; break;
            }
            var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
            return (c);
        }

        public countingTheNumberOfTeams(newModel): TeamModelList {
            let teamModelList: TeamModelList = {
                teamModel: []
            };
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
                    let team: TeamModel = {
                        team: newModel.dataPoints[i].team,
                        color: "yellow"
                    };
                    teamModelList.teamModel.push(team);
                }
            }
            return teamModelList;
        }
    }
}
