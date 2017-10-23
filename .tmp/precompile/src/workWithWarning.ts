module powerbi.extensibility.visual.chart6F792A8745784877BCD8F4ACA5AD4207  {

    export class WorkWithWarning {
        //main method
        public handlingOfWarnings(viewModel: ViewModel, modelWithLevels: ViewModel) {
            DataStorage.isWarning = true;
            let modelProblemElements: ViewModel = {
                dataPoints: [],
                teamSet: {},
                highlights: false
            };
            modelProblemElements = this.searchForErroneousElements(viewModel, modelWithLevels, modelProblemElements);

            this.definitionOfWarnings(modelProblemElements, viewModel);
        }

        //A method that returns all not drawn elements in which a bug is found
        private searchForErroneousElements(viewModel: ViewModel, modelWithLevels: ViewModel, modelProblemElements: ViewModel) {
            modelProblemElements.dataPoints = viewModel.dataPoints.filter(function (obj) { return modelWithLevels.dataPoints.indexOf(obj) == -1; });
            return modelProblemElements;
        }

        //search for matching id
        public searchForSimilarId(viewModel: ViewModel) {
            DataStorage.sameId = false;
            for (let i = 0; i < viewModel.dataPoints.length; i++) {
                for (let j = 0; j < viewModel.dataPoints.length; j++) {
                    if ((viewModel.dataPoints[i].id == viewModel.dataPoints[j].id) &&
                        (viewModel.dataPoints[i].id != "") && (viewModel.dataPoints[i].id != " ") &&
                        (viewModel.dataPoints[i].id != null) && (i != j)) {
                        DataStorage.sameId = true;
                    }
                }
            }
        }

        //error detection
        private definitionOfWarnings(modelProblemElements: ViewModel, viewModel: ViewModel) {

            DataStorage.errorList = new Array();
            let orphan = true;
            for (let i = 0; i < 14; i++) {
                DataStorage.errorList[i] = "";
            }

            DataStorage.errorList[9] = "are looped on each other";
            DataStorage.errorList[11] = "have non-existing id";
            DataStorage.errorList[13] = "are not associated with the main tree ";

            if (DataStorage.sameId) {
                DataStorage.errorList[2] = "have the same Id";
                DataStorage.criticalError = true;
            }
            for (let i = 0; i < modelProblemElements.dataPoints.length; i++) {
                if (viewModel.dataPoints.length == modelProblemElements.dataPoints.length) {
                    DataStorage.errorList[0] = "- The data do not contain a root element";
                }
                else {
                    if (!DataStorage.criticalError) {
                        if ((modelProblemElements.dataPoints[i].reportTo == "") || (modelProblemElements.dataPoints[i].reportTo == " ") ||
                            (modelProblemElements.dataPoints[i].reportTo == null)) {
                            DataStorage.errorList[4] = "- Data contain two or more root nodes";
                        }
                        else {

                            if (modelProblemElements.dataPoints[i].id == "notFound") {
                                DataStorage.errorList[6] = "do not have id";
                            }
                            else {
                                if (modelProblemElements.dataPoints[i].id == modelProblemElements.dataPoints[i].reportTo) {
                                    DataStorage.errorList[8] = DataStorage.errorList[8] + " " + modelProblemElements.dataPoints[i].id;
                                }
                                else {
                                    for (let j = 0; j < viewModel.dataPoints.length; j++) {
                                        if (modelProblemElements.dataPoints[i].reportTo == viewModel.dataPoints[j].id) {
                                            orphan = false;
                                        }
                                    }
                                    if (orphan) {
                                        DataStorage.errorList[10] = DataStorage.errorList[10] + " " + modelProblemElements.dataPoints[i].id;
                                    } else {
                                        DataStorage.errorList[12] = DataStorage.errorList[12] + " " + modelProblemElements.dataPoints[i].id;
                                    }
                                }
                                orphan = true;
                            }
                        }
                    }
                }
            }
            this.addingAttributes();
        }

        private addingAttributes() {

            for (let i = 0; i < DataStorage.errorList.length; i = i + 2) {
                if (DataStorage.errorList[i].length != 0) {
                    if ((i != 0) && (i != 4)) {
                        DataStorage.errorList[i] = "- Items " + DataStorage.errorList[i];
                    }
                }

            }
        }
    }
}