module powerbi.extensibility.visual {

    import ISelectionId = powerbi.visuals.ISelectionId;
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;


    export class Visual implements IVisual {

        public host: IVisualHost;
        private colorPalette: IColorPalette;
        private settings: VisualSettings;
        private viewModel: ViewModel;

        private static TeamsColorIdentifier: DataViewObjectPropertyIdentifier = {
            objectName: "teams",
            propertyName: "fill"
        };

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.colorPalette = this.host.colorPalette;
            DataStorage.selectionManager = options.host.createSelectionManager();
            DataStorage.divOuter = d3.select(options.element).append("div").classed("divOuter", true);
            DataStorage.divInner = DataStorage.divOuter.append("div");
            DataStorage.svg = DataStorage.divInner.append("svg")
            DataStorage.backgroundWindow = DataStorage.svg
                .append("g")
                .classed("backgroundWindow", true);

            DataStorage.barGroup = DataStorage.svg
                .append("g")
                .classed("bar-group", true);
        }

        private sortIndication(firstObject, secondObject) {
            if (firstObject.id > secondObject.id) return 1;
            else if (firstObject.id < secondObject.id) return -1;
            else return 0;
        }

        public update(options: VisualUpdateOptions) {
            DataStorage.scrollLeft = 0;
            DataStorage.scrollRight = 1;
            DataStorage.divOuter.style({ width: `${options.viewport.width}px`, height: `${options.viewport.height}px` });

            DrawElements.deletingOldShapes();
            let viewModel = this.getViewModel(options);
            this.viewModel = viewModel;
            this.settings = VisualSettings.parse(options
                && options.dataViews
                && options.dataViews[0]) as VisualSettings;

            viewModel.dataPoints = viewModel.dataPoints.sort(this.sortIndication);
            DataStorage.visualWindowWidth = options.viewport.width;
            DataStorage.visualWindowHeight = options.viewport.height;

            //initialization of user values (with tab Format)
            const nodes = this.settings.nodes;
            const links = this.settings.links;
            const levels = this.settings.levels;
            const legend = this.settings.legend;
            const warning = this.settings.warning;

            DataStorage.colorName = nodes.colorName;
            DataStorage.displayHeightAndWidth = nodes.displayHeightAndWidth;
            DataStorage.customShapeHeight = nodes.height;
            DataStorage.customShapeWidth = nodes.width;
            DataStorage.linksColor = links.color;
            DataStorage.isControls = levels.controls;
            DataStorage.customFontSizeTitle = nodes.fontSize;
            DataStorage.customFontSizeSubtitle = nodes.fontSubtitleSize;
            DataStorage.shapeType = nodes.shape;
            DataStorage.distanceBetweenTitleAndSubtitle = nodes.distanceBetweenTitleAndSubtitle;
            DataStorage.legend = legend.position;
            DataStorage.colorLegend = legend.colorLegend;
            DataStorage.fontLegendSize = legend.fontSize;
            DataStorage.showLegendTitle = legend.showLegend;
            DataStorage.showLegend = legend.show;
            DataStorage.titleLegend = legend.titleLegend;
            DataStorage.isMaxDepth = levels.isMaxDepth;
            DataStorage.showNodes = nodes.show;
            DataStorage.showWarning = warning.show;

            let drawElements: DrawElements = new DrawElements();
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let drawControlPanel: DrawControlPanel = new DrawControlPanel();
            let workWithTeams: WorkWithTeams = new WorkWithTeams();
            let workWithWarning: WorkWithWarning = new WorkWithWarning();

            DataStorage.isWarning = false;
            for (let i = 0; i < viewModel.dataPoints.length; i++) {
                if (viewModel.dataPoints[i].id == null) {
                    viewModel.dataPoints[i].id = "notFound";
                    viewModel.dataPoints[i].reportTo = "notFound";
                }
            }
            let modelWithLevels = calculationsForDrawing.findLevels(viewModel);

            workWithWarning.searchForSimilarId(viewModel);
            if ((viewModel.dataPoints.length != modelWithLevels.dataPoints.length) || (DataStorage.sameId)) {
                workWithWarning.handlingOfWarnings(viewModel, modelWithLevels);
            }

            calculationsForDrawing.searchOfHeirs(modelWithLevels);
            calculationsForDrawing.numbElemOnEachLevl(modelWithLevels);

            DataStorage.maxDepth = this.settings.levels.maxDepth;
            if ((DataStorage.maxDepth > 1) && (DataStorage.maxDepth < DataStorage.numbOfLevels) && (DataStorage.isMaxDepth)) {
                DataStorage.numbOfLevels = DataStorage.maxDepth - 1;
            }
            let numberOfVisibleLevels = DataStorage.numbOfLevels - 1;

            let modelWithVisibleElements = calculationsForDrawing.makingVisibleLevels(modelWithLevels, 0, numberOfVisibleLevels);
            calculationsForDrawing.findVisibleLevels(modelWithVisibleElements);
            calculationsForDrawing.countVisibleElemOnEachLevel(modelWithVisibleElements);

            let listTeams = workWithTeams.joiningCommandsWithColors(modelWithVisibleElements, viewModel);

            modelWithVisibleElements = calculationsForDrawing.calcOfWeightCof(modelWithVisibleElements);

            if (DataStorage.displayHeightAndWidth) {
                DataStorage.divOuter.style("overflow", "auto");
                if ((DataStorage.customShapeHeight > 0) && (DataStorage.customShapeWidth > 0)) {
                    DataStorage.visualWindowHeight = (DataStorage.customShapeHeight + DataStorage.customShapeHeight / 1.3) * DataStorage.numbVisibleLevls;
                    if ((DataStorage.showWarning) && (DataStorage.isWarning)) {
                        DataStorage.visualWindowHeight = DataStorage.visualWindowHeight + 100;
                    }
                    DataStorage.visualWindowWidth = DataStorage.customShapeWidth * 1.3 * DataStorage.maxElemWeight;
                }
                else {
                    DataStorage.displayHeightAndWidth = false;
                }
            }

            DataStorage.visualWindowWidth = DataStorage.visualWindowWidth - 25;
            DataStorage.visualWindowHeight = DataStorage.visualWindowHeight - 25;
            let minWindowHeight = 130;
            if ((DataStorage.showWarning) && (DataStorage.isWarning)) {
                minWindowHeight = 180;
            }
            let heightOfTheShape = 0;

            if ((options.viewport.height > minWindowHeight) && (!DataStorage.criticalError)) {
                heightOfTheShape = drawElements.drawingElements(options, modelWithVisibleElements, listTeams, numberOfVisibleLevels);
                drawElements.drawingRelationships(modelWithVisibleElements, heightOfTheShape);
            }
            drawControlPanel.drawControlPanel(options, modelWithVisibleElements, listTeams, heightOfTheShape, numberOfVisibleLevels);
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

        //getting data from a form (power bi)
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

            dataView.categorical.categories.forEach((column: DataViewCategoryColumn, columnIndex: number) => {
                Object.keys(column.source.roles).forEach((roleName: string) => {
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
                let team: string = "" as string;
                let position: string = "" as string;
                const teamId: number = 0 as number;
                const boolSelectionIds: boolean = false as boolean;
                const isHeirs: boolean = false as boolean;
                const elementWeight: number = 0 as number;
                const parentStartX: number = 0 as number;
                const highlighted: boolean = highlights ? highlights[dataPointIndex] ? true : false : false;
                const selectionId = this.host.createSelectionIdBuilder()
                    .withCategory(categories[columnIndexes.category], dataPointIndex)
                    .createSelectionId();
                const boolSelectionId: boolean = false as boolean;
                if (categories[columnIndexes.position] == undefined) {
                    position = "";
                } else {
                    position = categories[columnIndexes.position].values[dataPointIndex] as string;
                }
                if (categories[columnIndexes.team] == undefined) {
                    team = "";
                } else {
                    team = categories[columnIndexes.team].values[dataPointIndex] as string;
                }
                if (((team == " ") || (team == null) || (team == "")) && (columnIndexes.team != -1)) {
                    team = "Fill";
                }
                if (!viewModel.teamSet[team]) {
                    const color: string = this.getColor(
                        Visual.TeamsColorIdentifier,
                        DataStorage.defaultColor,
                        categories[columnIndexes.category].objects
                        && categories[columnIndexes.category].objects[dataPointIndex]
                        || {});

                    viewModel.teamSet[team] = {
                        team,
                        selectionIds: [selectionId],
                        color,
                        teamId,
                        boolSelectionIds
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
                    boolSelectionId,
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
}
