module powerbi.extensibility.visual.chart6F792A8745784877BCD8F4ACA5AD4207  {

    export class DrawWarning {

        public drawingWarningSign() {
            DataStorage.warningSign = DataStorage.barGroup.append("path")
                .classed("warningSign", true);

            DataStorage.warningSign
                .style("stroke", "#FF8C00")
                .style("fill", "#FFD700")
                .style("font-weight", "bold")
                .attr("d", "M 10 35 L 30 2 L 50 35 L 10 35")
                .on('mouseenter', () => {
                    this.drawingWarningWindow();
                })
                .on('mouseleave', () => {
                    DataStorage.barGroup
                        .selectAll(".warningWindow")
                        .remove();
                    DataStorage.barGroup
                        .selectAll(".warningText")
                        .remove();
                });


            DataStorage.warningSign = DataStorage.barGroup.append("text")
                .classed("warningSign", true);

            DataStorage.warningSign
                .text("!")
                .attr({
                    x: 30,
                    y: 22,
                    dy: "0.35em",
                    "text-anchor": "middle"
                }).style("font-size", 30 + "px")
                .style("text-align", "left")
                .style("font-weight", "500")
                .style("font", "sans-serif")
                .on('mouseenter', () => {
                    this.drawingWarningWindow();
                })
                .on('mouseleave', () => {
                    DataStorage.barGroup
                        .selectAll(".warningWindow")
                        .remove();
                    DataStorage.barGroup
                        .selectAll(".warningText")
                        .remove();
                })
        }

        /*
        public drawingWarningSign() {
            let path = "";
            Visual.warningSign = Visual.barGroup.append('image')
            .attr({
                'xlink:href': 'http://www.freeiconspng.com/uploads/warning-icon-24.png', 
                x: 10,
                y: 0,
                width: 40,
                height: 40
              }).classed("warningSign", true);
        }
        */

        /*
        public drawingWarningWindow() {
            let yCoordinate = 25;
            let lengthOfString = 0;
            let text;

            DataStorage.warningWindow = DataStorage.barGroup.append("rect")
                .classed('warningWindow', true);

            for (let i = 0; i < DataStorage.errorList.length; i = i + 2) {
                if (DataStorage.errorList[i].length > lengthOfString) {
                    lengthOfString = DataStorage.errorList[i].length;
                }
                if (DataStorage.errorList[i].length != 0) {
                    if ((i != 0)&&(i != 4)) {
                        text = "- Items ";
                    } else { text = ""; }
                    let k = 0;
                    let error = DataStorage.errorList[i].split(' ');
                    for (let j = 0; j < error.length; j++) {
                        text = text + " " + error[j];
                        k++;
                        if (k > 9) {
                            this.drawingWarningText(text, yCoordinate, i);
                            yCoordinate = yCoordinate + 15;
                            k = 0;
                            text = " ";
                        }
                    }
                    if (k != 0) {
                        this.drawingWarningText(text, yCoordinate, i);
                    }
                    yCoordinate = yCoordinate + 15;
                    text = DataStorage.errorList[i + 1];
                    if (text != "") {
                        this.drawingWarningText(text, yCoordinate, i);
                        yCoordinate = yCoordinate + 15;
                    }
                }
            }
            let widthWindow = lengthOfString * 7;
            if (DataStorage.visualWindowWidth < 280) {
                widthWindow = DataStorage.visualWindowWidth - 25;
            }
            DataStorage.warningWindow
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
        */
        private searchLongestStr(list) {
            let lengthOfString = 0;
            let longestWord = 0;
            for (let i = 0; i < list.length; i++) {
                if (list[i].length > lengthOfString) {
                    lengthOfString = list[i].length;
                }
                let error = DataStorage.errorList[i].split(' ');
                for (let j = 0; j < error.length; j++) {
                    if (error[j].length > longestWord) {
                        longestWord = error[j].length;
                    }
                }
            }
            return [lengthOfString, longestWord];
        }


        private splitExceptionIntoStrings(itemWarning, yCoordinate, scrollSize) {
            let text = "";
            let numberLines = 0;
            let error = DataStorage.errorList[itemWarning].split(' ');
            for (let j = 0; j < error.length; j++) {
                if ((text + error[j]).length * 6.5 < DataStorage.visualWindowWidth - scrollSize - 5) {
                    text = text + " " + error[j];
                }
                else {
                    this.drawingWarningText(text, yCoordinate, itemWarning);
                    yCoordinate = yCoordinate + 15;
                    numberLines++;
                    text = "";
                    j--;
                }
                if ((j + 1) == error.length) {
                    this.drawingWarningText(text, yCoordinate, itemWarning);
                    yCoordinate = yCoordinate + 15;
                    numberLines++;
                    text = "";
                }
            }
            return numberLines;
        }

        public drawingWarningWindow() {
            let yCoordinate = 25;
            let arrOfLengthVal = this.searchLongestStr(DataStorage.errorList);
            let lengthOfString = arrOfLengthVal[0];
            let longestWord = arrOfLengthVal[1];
            let noAreaForInfo = false;
            let scrollSize = 50;

            DataStorage.warningWindow = DataStorage.barGroup.append("rect")
                .classed('warningWindow', true);
            if (longestWord * 6.5 < DataStorage.visualWindowWidth - 60) {
                for (let i = 0; i < DataStorage.errorList.length; i = i + 2) {

                    if (i < 4) {
                        //then the distance under the scroll is absent
                        if (DataStorage.errorList[i].length != 0) {
                            scrollSize = 20;
                        }
                    }
                    if (DataStorage.errorList[i].length != 0) {
                        for (let j = i; j < i + 2; j++) {
                            if (DataStorage.errorList[j].length * 6.5 > DataStorage.visualWindowWidth - scrollSize) {
                                //the text climbs out the window
                                let numberLines = this.splitExceptionIntoStrings(j, yCoordinate, scrollSize);
                                yCoordinate = yCoordinate + numberLines * 15;
                            } else {
                                if (DataStorage.errorList[j].length != 0) {
                                    let text = DataStorage.errorList[j];
                                    this.drawingWarningText(text, yCoordinate, j);
                                    yCoordinate = yCoordinate + 15;
                                }
                            }
                        }
                    }
                }
            } else {
                noAreaForInfo = true;
            }

            let widthWindow;
            //6.5 (because one letter takes 6.5 pixels)
            if (lengthOfString * 6.5 > DataStorage.visualWindowWidth - 50) {
                if (scrollSize == 20) {
                    //then the distance under the scroll is absent
                    widthWindow = DataStorage.visualWindowWidth - 32;
                } else {
                    widthWindow = DataStorage.visualWindowWidth - 56;
                }
            } else {
                widthWindow = lengthOfString * 6.5;
            }
            if (noAreaForInfo) {
                widthWindow = 40;
            }
            DataStorage.warningWindow
                .style("fill", " #FFFACD")
                .style("stroke", "black")
                .style("stroke-width", 2)
                .attr({
                    rx: 6,
                    x: 55,
                    y: 10,
                    width: widthWindow,
                    height: yCoordinate - 10
                })
            if (noAreaForInfo) {
                this.inscriptionError();
            }
        }

        public inscriptionError() {
            DataStorage.warningText = DataStorage.barGroup.append("text")
                .classed('warningText', true);

            DataStorage.warningText
                .text("Error")
                .attr({
                    x: 60,
                    y: 22
                }).style("font-size", 12 + "px")
                .style("fill", "black")
                .style("text-align", "left");
        }

        public drawingWarningText(error, yCoordinate, errorId) {
            let color = "black";
            if ((errorId == 0) || (errorId == 2)) {
                color = "red";
            }
            DataStorage.warningText = DataStorage.barGroup.append("text")
                .classed('warningText', true);

            DataStorage.warningText
                .text(error)
                .attr({
                    x: 60,
                    y: yCoordinate
                }).style("font-size", 12 + "px")
                .style("fill", color)
                .style("text-align", "left");
        }
    }
}