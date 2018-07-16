module powerbi.extensibility.visual {

    //class responsible for drawing nodes and their events
    export class DrawElements {

        public drawingElements(options, newModel: ViewModel, listTeams: TeamModelList, numberOfVisibleLevels): number {

            DataStorage.svg.attr({
                width: DataStorage.visualWindowWidth,
                height: DataStorage.visualWindowHeight
            });
            let widthOfTheShape = 0;
            let heightOfTheShape = 0;
            let windowHeight = DataStorage.visualWindowHeight - 100;
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            heightOfTheShape = calculationsForDrawing.calcHeightShape(windowHeight);
            heightOfTheShape = calculationsForDrawing.searchSmallestValue(heightOfTheShape, windowHeight / 5)
            widthOfTheShape = calculationsForDrawing.calcWidthShape(DataStorage.visualWindowWidth, newModel.dataPoints[0].elementWeight);
            widthOfTheShape = calculationsForDrawing.searchSmallestValue(widthOfTheShape, DataStorage.visualWindowWidth / 5)
            let isHeightGreaterThanWidth = calculationsForDrawing.searchLargerValue(heightOfTheShape, widthOfTheShape);


            if (DataStorage.displayHeightAndWidth) {
                heightOfTheShape = DataStorage.customShapeHeight;
                widthOfTheShape = DataStorage.customShapeWidth;
            }
            DataStorage.widthOfTheShape = widthOfTheShape;

            let fontSizeValue: number = heightOfTheShape / 7;

            let xCenterCoordinate = 0;
            let yCenterCoordinate;
            if ((DataStorage.legend == "0") && (DataStorage.showLegend)) {
                yCenterCoordinate = 10 + heightOfTheShape + (heightOfTheShape / 2) * DataStorage.fontLegendSize / 20;
            }
            else {
                yCenterCoordinate = heightOfTheShape + (heightOfTheShape / 7);
            }
            if ((DataStorage.showWarning) && (DataStorage.isWarning)) {
                yCenterCoordinate = yCenterCoordinate + 50;
            }

            let gapWidth = widthOfTheShape * 1.2 - widthOfTheShape;
            let gapHeight = heightOfTheShape / 1.3;
            let minX = (DataStorage.visualWindowWidth / DataStorage.maxElemWeight) - gapWidth;

            let currentLevel = 0;
            let parent;
            let oldParent = "-";
            let xAddValueCoordinate = 0;
            let predAdd = 0;

            while (currentLevel <= DataStorage.numbVisibleLevls) {
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
                        if (((parent == " ") || (parent == "")) && (DataStorage.numbVisibleLevls == 1)) {
                            xAddValueCoordinate = DataStorage.visualWindowWidth / 2;
                        } else {
                            xAddValueCoordinate = ((minX + gapWidth) * newModel.dataPoints[i].elementWeight) / 2;
                        }
                        xCenterCoordinate = predAdd + xCenterCoordinate + xAddValueCoordinate;
                        predAdd = xAddValueCoordinate;
                        oldParent = parent;
                        let color = calculationsForDrawing.colorDefinitionByCommand(newModel, i, listTeams);
                        if (DataStorage.shapeType) {
                            this.drawingEllipse(xCenterCoordinate, yCenterCoordinate, heightOfTheShape,
                                widthOfTheShape, newModel, listTeams, color, i);
                        } else {
                            this.drawingRectangle(xCenterCoordinate, yCenterCoordinate, heightOfTheShape,
                                widthOfTheShape, newModel, listTeams, color, i);
                        }
                        if (newModel.dataPoints[i].isHeirs) {
                            this.drawingExpandOrCollapseButton(options, xCenterCoordinate, yCenterCoordinate,
                                heightOfTheShape, widthOfTheShape, newModel, listTeams,
                                color, numberOfVisibleLevels, newModel.dataPoints[i].lvl, i);
                        }

                        let offsetValue = DataStorage.distanceBetweenTitleAndSubtitle;
                        this.drawingTitle(xCenterCoordinate, yCenterCoordinate, newModel.dataPoints[i].title,
                            newModel, i, fontSizeValue, offsetValue, listTeams, numberOfVisibleLevels,
                            newModel.dataPoints[i].lvl, isHeightGreaterThanWidth, heightOfTheShape, widthOfTheShape);

                        this.drawingSubtitle(xCenterCoordinate, yCenterCoordinate, newModel, i, fontSizeValue,
                            offsetValue, listTeams, numberOfVisibleLevels,
                            newModel.dataPoints[i].lvl, isHeightGreaterThanWidth, heightOfTheShape, widthOfTheShape);

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

        //method for drawing the circle of folding / unfolding nodes
        public drawingExpandOrCollapseButton(
            options,
            xCenterCoordinate,
            yCenterCoordinate,
            heightOfTheShape,
            widthOfTheShape,
            newModel: ViewModel,
            listTeams: TeamModelList,
            color,
            numberOfVisibleLevels,
            lvl,
            i
        ) {
            let tempxCenterCoordinate = xCenterCoordinate;
            let tempyCenterCoordinate = yCenterCoordinate;

            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let workWithTeams: WorkWithTeams = new WorkWithTeams();
            let teamId = workWithTeams.joiningPersonsWithTeamId(newModel.dataPoints[i].team, listTeams);
            let transparency = 1;
            let isSelectedElements = this.determinationOfBoolSelectionId(newModel);
            if ((DataStorage.isExternalEventClick) || (isSelectedElements)) {
                transparency = 0.5;
            }
            if (newModel.dataPoints[i].boolSelectionId) { transparency = 1; }
            DataStorage.circle = DataStorage.barGroup.append("circle")
                .classed('circle', true).classed("team" + teamId, true).classed("id" + newModel.dataPoints[i].id, true);
            let value = "+";
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                if ((newModel.dataPoints[j].reportTo == newModel.dataPoints[i].id) && (newModel.dataPoints[j].isVisible)) { value = "-"; }
            }
            DataStorage.circle
                .style("fill", color)
                .style("stroke", "black")
                .style("opacity", transparency)
                .style("stroke-width", 1)
                .attr({
                    r: 6,
                    cx: xCenterCoordinate,
                    cy: yCenterCoordinate
                })
                .on('click', () => {
                    let nameOfTheParent = calculationsForDrawing.nameDeterminationByCoordinates(newModel, tempxCenterCoordinate, tempyCenterCoordinate);
                    this.clickEvent(options, newModel, nameOfTheParent, listTeams, numberOfVisibleLevels, i);
                });

            DataStorage.nameTextValue = DataStorage.barGroup.append("text")
                .classed("nameTextValue", true);

            DataStorage.nameTextValue
                .text(value)
                .attr({
                    x: xCenterCoordinate,
                    y: yCenterCoordinate + 6,
                    "text-anchor": "middle"
                }).style("font-size", "19px")

                .on('click', () => {
                    let nameOfTheParent = calculationsForDrawing.nameDeterminationByCoordinates(newModel, tempxCenterCoordinate, tempyCenterCoordinate);
                    this.clickEvent(options, newModel, nameOfTheParent, listTeams, numberOfVisibleLevels, i);
                });
            if ((newModel.dataPoints[i].highlighted) || (newModel.dataPoints[i].boolSelectionId)) {
                DataStorage.rectangle.style("opacity", 1);
            }
        }

        //If the user chooses that the nodes should be displayed by ellipses
        public drawingEllipse(
            xCenterCoordinate,
            yCenterCoordinate,
            heightOfTheShape,
            widthOfTheShape,
            newModel: ViewModel,
            listTeams: TeamModelList,
            color,
            i
        ) {
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            let workWithTeams: WorkWithTeams = new WorkWithTeams();
            let teamId = workWithTeams.joiningPersonsWithTeamId(newModel.dataPoints[i].team, listTeams);
            let transparency = 1;
            let isSelectedElements = this.determinationOfBoolSelectionId(newModel);
            if ((DataStorage.isExternalEventClick) || (isSelectedElements)) {
                transparency = 0.5;
                DataStorage.barGroup
                    .selectAll(".circle")
                    .style('opacity', 0.5);
                DataStorage.barGroup
                    .selectAll(".id" + newModel.dataPoints[i].id)
                    .style('opacity', 1);
            }
            DataStorage.rectangle = DataStorage.barGroup.append("ellipse")
                .classed('rectangle', true).classed("team" + teamId, true).classed("id" + newModel.dataPoints[i].id, true);
            DataStorage.rectangle
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
                .on("click", () => {
                    if((d3.event as MouseEvent).ctrlKey){
                        this.selectMultipleEvent(newModel, i, listTeams);
                    } else{
                        this.selectSingleEvent(newModel,i, listTeams);
                    }
                })

                // event for tooltip 
                .on("mouseover", () => {
                    this.calculationCoordinatesForTooltipDrawing(newModel, i, listTeams,
                        xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape);

                })
                .on("mouseout", function() {
                    DataStorage.barGroup
                        .selectAll(".toolTip")
                        .remove();

                    DataStorage.barGroup
                        .selectAll(".toolTipWindow")
                        .remove();
                    
                  });

            if ((newModel.dataPoints[i].highlighted) || (newModel.dataPoints[i].boolSelectionId)) {
                DataStorage.rectangle.style("opacity", 1);
            }
        }

        //Are there any selected node?
        public determinationOfBoolSelectionId(newModel: ViewModel) {
            let isSelectedElements = false;
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                if (newModel.dataPoints[i].boolSelectionId) {
                    isSelectedElements = true;
                }
            }
            return isSelectedElements;
        }

        //If the user chooses that the nodes should be displayed by Rectangle
        public drawingRectangle(
            xCenterCoordinate,
            yCenterCoordinate,
            heightOfTheShape,
            widthOfTheShape,
            newModel: ViewModel,
            listTeams: TeamModelList,
            color,
            i
        ) {
            let workWithTeams: WorkWithTeams = new WorkWithTeams();
            let teamId = workWithTeams.joiningPersonsWithTeamId(newModel.dataPoints[i].team, listTeams);
            let transparency = 1;
            let isSelectedElements = this.determinationOfBoolSelectionId(newModel);
            let drawControlPanel: DrawControlPanel = new DrawControlPanel();
            let isSelectedTeams = drawControlPanel.determinationOfBoolSelectionIdTeam(listTeams);
            if ((DataStorage.isExternalEventClick) || (isSelectedElements) || (isSelectedTeams)) {
                transparency = 0.5;
                DataStorage.barGroup
                    .selectAll(".circle")
                    .style('opacity', 0.5);
                DataStorage.barGroup
                    .selectAll(".id" + newModel.dataPoints[i].id)
                    .style('opacity', 1);

                for (let j = 0; j < listTeams.teamModel.length; j++) {
                    if (listTeams.teamModel[j].boolSelectionIds) {
                        DataStorage.barGroup
                            .selectAll(".team" + listTeams.teamModel[j].teamId)
                            .style('opacity', 1);
                    }
                }
            }

            DataStorage.rectangle = DataStorage.barGroup.append("rect")
                .classed('rectangle', true).classed("team" + teamId, true).classed("id" + newModel.dataPoints[i].id, true);

            DataStorage.rectangle
                .style("fill", color)
                .style("opacity", transparency)
                .style("stroke", "black")
                .style("stroke-width", 2)
                .attr({
                    //rx: 6,
                    x: xCenterCoordinate - widthOfTheShape / 2,
                    y: yCenterCoordinate - heightOfTheShape,
                    width: widthOfTheShape,
                    height: heightOfTheShape
                })
                .on("click", () => {
                    if((d3.event as MouseEvent).ctrlKey){
                        this.selectMultipleEvent(newModel, i, listTeams);
                    } else{
                        this.selectSingleEvent(newModel,i, listTeams);
                    }
                })

                // event for tooltip 
                .on("mouseover", () => {
                    this.calculationCoordinatesForTooltipDrawing(newModel, i, listTeams,
                        xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape);

                })
                .on("mouseout", function() {
                    DataStorage.barGroup
                        .selectAll(".toolTip")
                        .remove();

                    DataStorage.barGroup
                        .selectAll(".toolTipWindow")
                        .remove();
                    
                  });

            if ((newModel.dataPoints[i].highlighted) || (newModel.dataPoints[i].boolSelectionId)) {
                DataStorage.rectangle.style("opacity", 1);
            }
        }

        public drawingTitle(
            xCenterCoordinate,
            yCenterCoordinate,
            title,
            newModel: ViewModel,
            i,
            fontSizeValue,
            offsetValue,
            listTeams: TeamModelList,
            numberOfVisibleLevels,
            lvl,
            isHeightGreaterThanWidth, 
            heightOfTheShape,
            widthOfTheShape
        ) {
            let writingMode;
            let xCoordinate;
            let yCoordinate;
            if (isHeightGreaterThanWidth && !DataStorage.showWraps) {
                writingMode = "tb";
                xCoordinate = xCenterCoordinate + widthOfTheShape / 4;
                yCoordinate = yCenterCoordinate - heightOfTheShape / 2 + offsetValue / 2;
            }
            else if (isHeightGreaterThanWidth && DataStorage.showWraps) {
                writingMode = "tb";
                xCoordinate = xCenterCoordinate + widthOfTheShape / 4;
                yCoordinate = yCenterCoordinate - heightOfTheShape / 2;
            }
            else {
                writingMode = "bt";
                xCoordinate = xCenterCoordinate;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3 - offsetValue;
            }

            if(DataStorage.showWraps){
                DataStorage.nameTextValue = DataStorage.barGroup.append("foreignObject")
                    .classed("nameTextValue", true)
                    .attr("width",  widthOfTheShape + "px")
                    .attr("height", heightOfTheShape / 2 + "px");
                DataStorage.nameTextValue
                    .attr({
                        x: isHeightGreaterThanWidth ? xCoordinate - widthOfTheShape / 4 : xCoordinate - widthOfTheShape / 2,
                        y: isHeightGreaterThanWidth ? yCoordinate - heightOfTheShape / 2 : yCoordinate - heightOfTheShape / 2 + offsetValue / 2,
                        "text-anchor": "middle"
                    })
                    .append("xhtml:body")
                    .classed("in-block", true)
                    .text(title)
                    .classed("foreign-body-row", true)
                    .style("width",  isHeightGreaterThanWidth ? widthOfTheShape / 2 + "px" : widthOfTheShape + "px")
                    .style("height", isHeightGreaterThanWidth ? heightOfTheShape + "px" : heightOfTheShape / 2 + "px")
                    .style("font-size", DataStorage.customFontSizeTitle + "px")
                    .style("line-height", DataStorage.customFontSizeTitle + "px")
                    .style("fill", DataStorage.colorName)
                    .style("writing-mode", writingMode)

                    .on("click", () => {
                        if((d3.event as MouseEvent).ctrlKey){
                            this.selectMultipleEvent(newModel, i, listTeams);
                        } else{
                            this.selectSingleEvent(newModel,i, listTeams);
                        }
                    })

                    // event for tooltip
                    .on("mouseover", () => {
                        this.calculationCoordinatesForTooltipDrawing(newModel, i, listTeams,
                            xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape);
                    })
                    .on("mouseout", function() {
                        DataStorage.barGroup
                            .selectAll(".toolTip")
                            .remove();
                        DataStorage.barGroup
                            .selectAll(".toolTipWindow")
                            .remove();
                    });
            }
            else {
                DataStorage.nameTextValue = DataStorage.barGroup.append("text")
                    .classed("nameTextValue", true)
                    .style("width",  widthOfTheShape + "px")
                    .style("height", heightOfTheShape + "px");
                DataStorage.nameTextValue
                    .attr({
                        x: xCoordinate,
                        y: isHeightGreaterThanWidth ? yCoordinate : yCoordinate - offsetValue,
                        "text-anchor": "middle"
                    })
                    .text(title)
                    .style("width",  widthOfTheShape + "px")
                    .style("height", heightOfTheShape / 2 + "px")
                    .style("font-size", DataStorage.customFontSizeTitle + "px")
                    .style("line-height", DataStorage.customFontSizeTitle + "px")
                    .style("fill", DataStorage.colorName)
                    .style("writing-mode", writingMode)

                    .on("click", () => {
                        if((d3.event as MouseEvent).ctrlKey){
                            this.selectMultipleEvent(newModel, i, listTeams);
                        } else{
                            this.selectSingleEvent(newModel,i, listTeams);
                        }
                    })

                    // event for tooltip
                    .on("mouseover", () => {
                        this.calculationCoordinatesForTooltipDrawing(newModel, i, listTeams,
                            xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape);
                    })
                    .on("mouseout", function() {
                        DataStorage.barGroup
                            .selectAll(".toolTip")
                            .remove();
                        DataStorage.barGroup
                            .selectAll(".toolTipWindow")
                            .remove();
                    });
            }
        }

        public drawingSubtitle(
            xCenterCoordinate,
            yCenterCoordinate,
            newModel: ViewModel,
            i,
            fontSizeValue,
            offsetValue,
            listTeams: TeamModelList,
            numberOfVisibleLevels,
            lvl,
            isHeightGreaterThanWidth,
            heightOfTheShape,
            widthOfTheShape
        ) {
            let writingMode;
            let xCoordinate;
            let yCoordinate;
            if (isHeightGreaterThanWidth) {
                writingMode = "tb";
                xCoordinate = xCenterCoordinate - widthOfTheShape / 4;
                yCoordinate = yCenterCoordinate - heightOfTheShape / 2;
            }
            else {
                writingMode = "bt";
                xCoordinate = xCenterCoordinate;
                yCoordinate = yCenterCoordinate - fontSizeValue * 3 + offsetValue;
            }

            if(DataStorage.showWraps){
                DataStorage.subtitleTextValue = DataStorage.barGroup.append("foreignObject")
                    .classed("subtitleTextValue", true)
                    .attr("width",  widthOfTheShape + "px")
                    .attr("height", heightOfTheShape / 2 + "px");
                DataStorage.subtitleTextValue
                    .attr({
                        x: isHeightGreaterThanWidth ? xCoordinate - widthOfTheShape / 4 + offsetValue / 2 : xCoordinate - widthOfTheShape / 2,
                        y: isHeightGreaterThanWidth ? yCoordinate - heightOfTheShape / 2 : yCoordinate - heightOfTheShape / 4 - offsetValue,
                        "text-anchor": "middle"
                    })
                    .append("xhtml:body")
                    .classed("in-block", true)
                    .text(newModel.dataPoints[i].position)
                    .classed("foreign-body-row", true)
                    .style("width",  isHeightGreaterThanWidth ? widthOfTheShape / 2 + "px" : widthOfTheShape + "px")
                    .style("height", isHeightGreaterThanWidth ? heightOfTheShape + "px" : heightOfTheShape / 2 + "px")
                    .style("font-size", DataStorage.customFontSizeTitle + "px")
                    .style("line-height", DataStorage.customFontSizeTitle + "px")
                    .style("fill", DataStorage.colorName)
                    .style("writing-mode", writingMode)

                    .on("click", () => {
                        if((d3.event as MouseEvent).ctrlKey){
                            this.selectMultipleEvent(newModel, i, listTeams);
                        } else{
                            this.selectSingleEvent(newModel,i, listTeams);
                        }
                    })

                    // event for tooltip
                    .on("mouseover", () => {
                        this.calculationCoordinatesForTooltipDrawing(newModel, i, listTeams,
                            xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape);
                    })
                    .on("mouseout", function() {
                        DataStorage.barGroup
                            .selectAll(".toolTip")
                            .remove();
                        DataStorage.barGroup
                            .selectAll(".toolTipWindow")
                            .remove();
                    });
            }
            else {
                DataStorage.nameTextValue = DataStorage.barGroup.append("text")
                    .classed("nameTextValue", true)
                    .style("width",  widthOfTheShape + "px")
                    .style("height", heightOfTheShape + "px");
                DataStorage.nameTextValue
                    .attr({
                        x: isHeightGreaterThanWidth ? xCoordinate + offsetValue / 2 : xCoordinate,
                        y: isHeightGreaterThanWidth ? yCoordinate + offsetValue : yCoordinate,
                        "text-anchor": "middle"
                    })
                    .text(newModel.dataPoints[i].position)
                    .style("width",  widthOfTheShape + "px")
                    .style("height", heightOfTheShape / 2 + "px")
                    .style("font-size", DataStorage.customFontSizeTitle + "px")
                    .style("line-height", DataStorage.customFontSizeTitle + "px")
                    .style("fill", DataStorage.colorName)
                    .style("writing-mode", writingMode)

                    .on("click", () => {
                        if((d3.event as MouseEvent).ctrlKey){
                            this.selectMultipleEvent(newModel, i, listTeams);
                        } else{
                            this.selectSingleEvent(newModel,i, listTeams);
                        }
                    })

                    // event for tooltip
                    .on("mouseover", () => {
                        this.calculationCoordinatesForTooltipDrawing(newModel, i, listTeams,
                            xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape);
                    })
                    .on("mouseout", function() {
                        DataStorage.barGroup
                            .selectAll(".toolTip")
                            .remove();
                        DataStorage.barGroup
                            .selectAll(".toolTipWindow")
                            .remove();
                    });
            }
        }

        // highlighting selected nodes withOut Ctrl
        public selectSingleEvent(newModel: ViewModel, i, listTeams){
            let drawControlPanel: DrawControlPanel = new DrawControlPanel();
            DataStorage.selectionManager.clear();
            if (!newModel.dataPoints[i].boolSelectionId) {
                drawControlPanel.resetAllSelectedItems(listTeams, newModel);
                newModel.dataPoints[i].boolSelectionId = true;
                drawControlPanel.changeVisiblElements(0.5);
                DataStorage.selectionManager.select(newModel.dataPoints[i].selectionId, true);
                DataStorage.barGroup
                .selectAll(".id" + newModel.dataPoints[i].id)
                .style('opacity', 1);
            }
            else {
                drawControlPanel.resetAllSelectedItems(listTeams, newModel);
                drawControlPanel.changeVisiblElements(1);
            }
            DataStorage.makeSingleEvent = true;
        }



        // for pointing
        public calculationCoordinatesForTooltipDrawing(newModel: ViewModel, i, listTeams,
        xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape) {

            if(widthOfTheShape > 80) {
                if(widthOfTheShape > 150) {
                    widthOfTheShape = widthOfTheShape - 100;
                }else {
                    widthOfTheShape = widthOfTheShape - 55;
                }
            }else if(heightOfTheShape > 80) {
                if(heightOfTheShape > 150) {
                    heightOfTheShape = heightOfTheShape - 170;
                }else {
                    heightOfTheShape = heightOfTheShape - 55;
                }
            }
    
            if((DataStorage.visualWindowWidth - xCenterCoordinate) < 400 && (DataStorage.visualWindowHeight - yCenterCoordinate) < 100) {       
                yCenterCoordinate = yCenterCoordinate - heightOfTheShape*4.5;
                xCenterCoordinate = xCenterCoordinate - widthOfTheShape*3;
            }else if((DataStorage.visualWindowWidth - xCenterCoordinate) < 400 && (DataStorage.visualWindowHeight - yCenterCoordinate) > 100) {
                yCenterCoordinate = yCenterCoordinate - heightOfTheShape*2;
                xCenterCoordinate = xCenterCoordinate - widthOfTheShape*3;
            }else if(DataStorage.visualWindowHeight - yCenterCoordinate < 160) {
                
                if(DataStorage.visualWindowWidth - xCenterCoordinate >= 160) {
                    yCenterCoordinate = yCenterCoordinate - heightOfTheShape*3;
                    xCenterCoordinate = xCenterCoordinate + widthOfTheShape*1.6;
                }else if(DataStorage.visualWindowWidth - xCenterCoordinate >= 300) {
                    yCenterCoordinate = yCenterCoordinate - heightOfTheShape*2;
                    xCenterCoordinate = xCenterCoordinate + widthOfTheShape*1.6;
                }else if(DataStorage.visualWindowWidth - xCenterCoordinate >= 1000) {
                    yCenterCoordinate = yCenterCoordinate - heightOfTheShape*2;
                    xCenterCoordinate = xCenterCoordinate + widthOfTheShape*1.6;
                }  
            }else if(DataStorage.visualWindowHeight - yCenterCoordinate > 160) {
                
                if(DataStorage.visualWindowWidth - xCenterCoordinate >= 160) {
                    xCenterCoordinate = xCenterCoordinate + widthOfTheShape*1.6;
                }else if(DataStorage.visualWindowWidth - xCenterCoordinate >= 300) {
                    xCenterCoordinate = xCenterCoordinate + widthOfTheShape*1.6;
                }else if(DataStorage.visualWindowWidth - xCenterCoordinate >= 1000) {
                    xCenterCoordinate = xCenterCoordinate + widthOfTheShape*1.6;
                }
            }

            if(DataStorage.visualWindowHeight - yCenterCoordinate > 350) {
                yCenterCoordinate = yCenterCoordinate + heightOfTheShape;
            }

            let parentID = newModel.dataPoints[i].reportTo;
            let parentName = "";
            for(let j = 0; j < newModel.dataPoints.length; j++) {
                if(newModel.dataPoints[j].id == parentID) {
                    parentName = newModel.dataPoints[j].title;
                }
            }
    
            if(heightOfTheShape < 30) {
                heightOfTheShape = heightOfTheShape + 20;
            }else if(heightOfTheShape > 80) {
                heightOfTheShape = heightOfTheShape - 50;
            }
    
            if(widthOfTheShape < 100) {
                if(parentName.length >= 15) {
                    widthOfTheShape = widthOfTheShape + parentName.length*3;
                    xCenterCoordinate = xCenterCoordinate - 50;
                }else if(newModel.dataPoints[i].title.length >= 15) {
                    widthOfTheShape = widthOfTheShape + newModel.dataPoints[i].title.length*3;
                    xCenterCoordinate = xCenterCoordinate - 50;
                 }
    
                if(widthOfTheShape < 90) {
                    widthOfTheShape = widthOfTheShape + 20;
                }
            }
    
            if(newModel.dataPoints[i].tooltip != "") {
                heightOfTheShape = heightOfTheShape - 80;
                if(newModel.dataPoints[i].tooltip.length >= 10) {
                    widthOfTheShape = widthOfTheShape + 16;
                }else {
                    widthOfTheShape = widthOfTheShape - 40;
                }

                if(heightOfTheShape >= 30) {
                    heightOfTheShape = heightOfTheShape - 20;
                }
            }

            if(DataStorage.showTooltip) {
                this.drawingTooltipBox(xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape);
                this.drawingTextOnTooltip(newModel, i, parentName, xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape);     
            } 

        }

        public drawingTextOnTooltip(newModel: ViewModel, i, parentName, xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape) {
            let headersArray = this.dataStringToHeadersArray(newModel,i);    
            let dataString = "";
            if(newModel.dataPoints[i].tooltip == "") {

                dataString = headersArray[1] + ": " + newModel.dataPoints[i].title;
                this.drawingTooltipText(dataString, xCenterCoordinate, yCenterCoordinate);
                yCenterCoordinate = yCenterCoordinate + 20;
                dataString = "";
    
                if(newModel.dataPoints[i].position == "" || newModel.dataPoints[i].position == null) {
                    dataString = "";
                }else {
                    dataString = headersArray[2] + ": " + newModel.dataPoints[i].position;
                    this.drawingTooltipText(dataString, xCenterCoordinate, yCenterCoordinate);
                    yCenterCoordinate = yCenterCoordinate + 20;
                    dataString = "";
                }

                if(newModel.dataPoints[i].team == "Fill" || newModel.dataPoints[i].team == "fill" || 
                    newModel.dataPoints[i].team == "" || newModel.dataPoints[i].team == null) {
                    dataString = headersArray[4] + ": " + " ";
                    dataString = "";
                }else {
                    dataString = headersArray[4] + ": " + newModel.dataPoints[i].team;
                    this.drawingTooltipText(dataString, xCenterCoordinate, yCenterCoordinate);
                    yCenterCoordinate = yCenterCoordinate + 20;
                    dataString = "";
                }
            
                dataString = headersArray[3] + ": " + parentName;
                this.drawingTooltipText(dataString, xCenterCoordinate, yCenterCoordinate);
                yCenterCoordinate = yCenterCoordinate + 20;
                dataString = "";
    
                dataString = "Level: " + newModel.dataPoints[i].lvl;
                this.drawingTooltipText(dataString, xCenterCoordinate, yCenterCoordinate);
                yCenterCoordinate = yCenterCoordinate + 20;
                dataString = "";
    
                dataString = headersArray[0] + ": " + newModel.dataPoints[i].id;
                this.drawingTooltipText(dataString, xCenterCoordinate, yCenterCoordinate);
                yCenterCoordinate = yCenterCoordinate + 20;
                dataString = "";
            }
                 

            if(newModel.dataPoints[i].tooltip != "") {
                dataString = newModel.dataPoints[i].tooltip;
                this.drawingTooltipText(dataString, xCenterCoordinate, yCenterCoordinate);
                dataString = "";
            } 
        }

        public dataStringToHeadersArray(newModel: ViewModel, i) {
            let dataStringForTooltip = "";
            dataStringForTooltip = newModel.dataPoints[i].nameOfHeader;
            let replaceArray = dataStringForTooltip.replace(/['"«»]/g, '');
            let arrayWithoutSymbols = [];
            for(let a = 0; a < replaceArray.length; a++) {
                if(replaceArray[a] == "r") {
                    a++;
                    if(replaceArray[a] == ":") {
                        a++;
                        if(replaceArray[a] != "{") {
                            do{
                                arrayWithoutSymbols.push(replaceArray[a]);
                                a++;
                            }
                            while(replaceArray[a] != "{");
                        }
                    }
                }
            }
                    
            let arrayToString = "";
            for(let k = 0; k < arrayWithoutSymbols.length; k++) {
                if(arrayWithoutSymbols[k] != "," && arrayWithoutSymbols[k] != "{" && 
                    arrayWithoutSymbols[k] != "}" && arrayWithoutSymbols[k] != ":") {
                    arrayToString += arrayWithoutSymbols[k];
                }
                if(arrayWithoutSymbols[k + 1] == arrayWithoutSymbols[k].toUpperCase()) {
                    arrayToString += ",";
                }
            }

            let arrayWithoutSymbolr = "";
            for(let z = 0; z < arrayToString.length; z++) {
                if(arrayToString[z] == "r"){
                    if(arrayToString[z-1] != ",")  {
                        arrayWithoutSymbolr += arrayToString[z];
                    }
                }
                else {
                    if(arrayToString[z-1] != ",")  {
                        arrayWithoutSymbolr += arrayToString[z];
                    }
                }
            }
    
            let headersArray = [];
            let text = "";
            for(let m = 0; m < arrayWithoutSymbolr.length; m++) {
                if(arrayWithoutSymbolr[m] != ",") {
                    text += arrayWithoutSymbolr[m];
                }else {
                    headersArray.push(text);
                    text = "";
                }
            }
    
            let defaultArrayForTolltip = ["ID", "Name", "Position", "Мanager", "Team", "Tooltip"];
            let countArray = 1;
            for(let count = 0; count < headersArray.length; count++) {
                if(headersArray[count].toUpperCase() == ("COLUMN" + countArray)) {
                    headersArray[count] = defaultArrayForTolltip[count];
                }
                countArray++;
            }
            return headersArray;
        }

        public drawingTooltipBox(xCenterCoordinate, yCenterCoordinate, widthOfTheShape, heightOfTheShape) {
            DataStorage.toolTipWindow = DataStorage.barGroup.append("rect")
            .classed('toolTipWindow', true);

        DataStorage.toolTipWindow
            .style("fill", "#FFEFD5")
            .style("stroke", "#808080")
            .style("stroke-width", 2)
            .attr({
                rx: 6,
                x: xCenterCoordinate - 34,
                y: yCenterCoordinate + 10,
                width: widthOfTheShape + 80,
                height: heightOfTheShape + 93
            });
        }
        

        public drawingTooltipText(text, xCenterCoordinate, yCenterCoordinate) {
            DataStorage.toolTip = DataStorage.barGroup.append("text")
            .classed('toolTip', true);
        DataStorage.toolTip
            .text(text)
            .style("stroke-width", 2)
            .style("font-size", 12 + "px")
            .style("fill", "#696969")
            .style("text-align", "left")
            .style("z-index", "999")
            .attr({
                x: xCenterCoordinate - 29,
                y: yCenterCoordinate + 27
            
            });
        }
    

        //highlighting selected nodes with Ctrl
        public selectMultipleEvent(newModel: ViewModel, i, listTeams) {
            let drawControlPanel: DrawControlPanel = new DrawControlPanel();
            if(DataStorage.makeSingleEvent){
                DataStorage.selectionManager.clear();
                drawControlPanel.resetAllSelectedItems(listTeams, newModel);
            }
            DataStorage.makeSingleEvent = false;
            if (!newModel.dataPoints[i].boolSelectionId) {
                newModel.dataPoints[i].boolSelectionId = true;
            }
            else {
                newModel.dataPoints[i].boolSelectionId = false;
            }
            
            if ((drawControlPanel.determinationOfBoolSelectionIdTeam(listTeams)) || this.determinationOfBoolSelectionId(newModel)) {

                drawControlPanel.changeVisiblElements(0.5);
                for (let j = 0; j < listTeams.teamModel.length; j++) {
                    if (listTeams.teamModel[j].boolSelectionIds) {
                        DataStorage.barGroup
                            .selectAll(".team" + listTeams.teamModel[j].teamId)
                            .style('opacity', 1);
                    }
                }
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if (newModel.dataPoints[i].boolSelectionId) {
                        DataStorage.barGroup
                            .selectAll(".id" + newModel.dataPoints[i].id)
                            .style('opacity', 1);
                    }
                }
                DataStorage.selectionManager.select(newModel.dataPoints[i].selectionId, true);

            } else {
                DataStorage.selectionManager.clear();
                drawControlPanel.changeVisiblElements(1);
                drawControlPanel.resetAllSelectedItems(listTeams, newModel);
            }
        }

        //collapsing event (folding / unfolding nodes) (+/- for nodes)
        public clickEvent(options, newModel: ViewModel, nameOfTheParent, listTeams: TeamModelList, numberOfVisibleLevels, i) {

            DrawElements.deletingOldShapes();
            DataStorage.scrollLeft = 0;
            DataStorage.scrollRight = 1;
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                if (newModel.dataPoints[i].id == newModel.dataPoints[j].reportTo) {
                    DataStorage.isDependenciesVisible = newModel.dataPoints[j].isVisible;
                }
            }
            let calculationsForDrawing: CalculationsForDrawing = new CalculationsForDrawing();
            if (DataStorage.isDependenciesVisible) {
                newModel = calculationsForDrawing.makingVisibleAndInVisibleHeir(newModel, nameOfTheParent, false);
                DataStorage.isDependenciesVisible = false;
            }
            else {
                newModel = calculationsForDrawing.makingVisibleAndInVisibleHeir(newModel, nameOfTheParent, true);
                DataStorage.isDependenciesVisible = true;
            }
            calculationsForDrawing.numbElemOnEachLevl(newModel);
            calculationsForDrawing.findVisibleLevels(newModel);
            calculationsForDrawing.countVisibleElemOnEachLevel(newModel);
            newModel = calculationsForDrawing.calcOfWeightCof(newModel);
            let heightOfTheShape = this.drawingElements(options, newModel, listTeams, numberOfVisibleLevels);
            this.drawingRelationships(newModel, heightOfTheShape);
            let drawControlPanel: DrawControlPanel = new DrawControlPanel();
            drawControlPanel.drawControlPanel(options, newModel, listTeams, heightOfTheShape, numberOfVisibleLevels);
        }

        public drawingRelationships(newModel: ViewModel, heightOfTheShape: number) {

            let elementsOfTheCurrentLevel = 0;
            let elementsOfTheNextLevel = elementsOfTheCurrentLevel + 1;
            let mainCommunicationElementName;
            let xConnectionCoordinate;
            let yConnectionCoordinate;

            while (elementsOfTheCurrentLevel <= DataStorage.numbVisibleLevls) {
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if ((newModel.dataPoints[i].lvl === elementsOfTheCurrentLevel) && (newModel.dataPoints[i].isVisible)) {
                        mainCommunicationElementName = newModel.dataPoints[i].id;
                        xConnectionCoordinate = newModel.dataPoints[i].xCoordinate;
                        yConnectionCoordinate = newModel.dataPoints[i].yCoordinate;

                        for (let j = 0; j < newModel.dataPoints.length; j++) {
                            if ((newModel.dataPoints[j].lvl === elementsOfTheNextLevel) &&
                                (newModel.dataPoints[j].reportTo === mainCommunicationElementName) &&
                                (newModel.dataPoints[j].isVisible)) {

                                DataStorage.connection = DataStorage.barGroup.append("line")
                                    .classed('connection', true);

                                DataStorage.connection
                                    .style("stroke", DataStorage.linksColor)
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
            DataStorage.barGroup
                .selectAll(".rectangle")
                .remove();

            DataStorage.barGroup
                .selectAll(".nameTextValue")
                .remove();

            DataStorage.barGroup
                .selectAll(".subtitleTextValue")
                .remove();

            DataStorage.barGroup
                .selectAll(".connection")
                .remove();
            DataStorage.barGroup
                .selectAll(".circle")
                .remove();
            DataStorage.barGroup
                .selectAll(".imageScroll")
                .remove();

            DataStorage.barGroup
                .selectAll(".warningSign")
                .remove();
        }
    }
}