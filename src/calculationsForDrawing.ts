module powerbi.extensibility.visual {
        export class CalculationsForDrawing {
        //calculation Of Weighting Coefficients
        public calcOfWeightCof(newModel: ViewModel) {
            let currentWeight = 1;
            let currentLevel = DataStorage.numbVisibleLevls - 1;
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {
                    newModel.dataPoints[i].elementWeight = currentWeight;
                }
            }
            currentLevel--;
            while (currentLevel >= 0) {
                for (let i = 0; i < newModel.dataPoints.length; i++) {
                    if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {
                        currentWeight = this.weightCurrentElement(newModel, currentLevel, i);
                        newModel.dataPoints[i].elementWeight = currentWeight;
                        if (currentLevel == 0) {
                            DataStorage.maxElemWeight = currentWeight
                        }
                    }
                }
                currentLevel--;
            }
            return newModel;
        }

        //counting The Weight Current Element
        public weightCurrentElement(newModel: ViewModel, currentLevel, i): number {

            let currentWeight = 0;
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                if ((newModel.dataPoints[j].lvl === currentLevel + 1) && (newModel.dataPoints[j].isVisible) && 
                (newModel.dataPoints[i].id === newModel.dataPoints[j].reportTo)) {
                    currentWeight = currentWeight + newModel.dataPoints[j].elementWeight;
                }
            }
            if (currentWeight == 0) {
                currentWeight = 1;
            }
            return currentWeight;
        }

        //search for the smallest value
        public searchSmallestValue(firstValue, secondValue): number {
            if (firstValue < secondValue) {
                return firstValue;
            }
            else {
                return secondValue;
            }
        }

        //search for the highest value
        public searchLargerValue(firstValue, secondValue): boolean {
            if (firstValue > secondValue) {
                return true;
            }
            else {
                return false;
            }
        }
        //calculating The Width Of Shape
        public calcWidthShape(widthOfTheWindow, Weight): number {
            let widthOfTheShape: number = widthOfTheWindow / (Weight * 1.2);
            return widthOfTheShape;
        }
        //calculating The Height Of Shape
        public calcHeightShape(heightOfTheWindow): number {
            let maxNumberOfTheLevel = DataStorage.numbVisibleElemOnLevel.length;
            let heightOfTheShape: number = heightOfTheWindow / (maxNumberOfTheLevel * 1.3);
            return heightOfTheShape;
        }

        //Determine the color of the element by grounds of belonging to a team
        public colorDefinitionByCommand(newModel: ViewModel, index, listTeams: TeamModelList): string {
            let color;
            for (let i = 0; i < listTeams.teamModel.length; i++) {
                if (newModel.dataPoints[index].team === listTeams.teamModel[i].team) {
                    color = listTeams.teamModel[i].color;
                }
            }
            return color;
        }

        //change the visibility of an element of some level
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

        //counting only visible elements (number Of Elements On Each Level That Is Visible)
        public countVisibleElemOnEachLevel(newModel: ViewModel) {
            DataStorage.numbVisibleElemOnLevel = new Array();

            for (let i = 0; i < DataStorage.numbVisibleLevls + 1; i++) {
                DataStorage.numbVisibleElemOnLevel.push(0);
            }
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                if (newModel.dataPoints[j].isVisible) {
                    let levelOfTheCurrentItem = 0;
                    let temp = 0;
                    levelOfTheCurrentItem = newModel.dataPoints[j].lvl;
                    temp = DataStorage.numbVisibleElemOnLevel[levelOfTheCurrentItem];
                    DataStorage.numbVisibleElemOnLevel[levelOfTheCurrentItem] = temp + 1;
                }
            }
        }

        //search for visible levels (find Levels That Is Visible)
        public findVisibleLevels(newModel: ViewModel) {
            let currentLevel = 0;
            let previousLevel = -1;
            DataStorage.isExternalEventClick = false;
            while (previousLevel != currentLevel) {
                if (currentLevel > DataStorage.numbOfLevels - 1) { break; }
                for (let i = 0, len = newModel.dataPoints.length; i < len; i++) {
                    if (newModel.dataPoints[i].highlighted) { DataStorage.isExternalEventClick = true; }
                    previousLevel = currentLevel;
                    if ((newModel.dataPoints[i].lvl === currentLevel) && (newModel.dataPoints[i].isVisible)) {
                        currentLevel++;
                    }
                }
            }
            DataStorage.numbVisibleLevls = currentLevel;
        }

        //determine which node has heirs
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

        //when you hide an element, you need to hide its heirs
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
                        if (newModel.dataPoints[i].lvl < DataStorage.numbOfLevels + 1) {
                            newModel.dataPoints[i].isVisible = isVisible;
                        }

                    }
                }
            }
            while (listNames.length != 0);
            return newModel;
        }

        //determine the parent by coordinates
        public nameDeterminationByCoordinates(newModel, xCenterCoordinate, yCenterCoordinate): string {
            let nameOfTheParent = "";
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                if ((xCenterCoordinate == newModel.dataPoints[i].xCoordinate) && (yCenterCoordinate == newModel.dataPoints[i].yCoordinate)) {
                    nameOfTheParent = newModel.dataPoints[i].id;
                }
            }
            return nameOfTheParent;
        }

        //number Of Elements On Each Level
        public numbElemOnEachLevl(newModel) {
            DataStorage.numbElemOnLevel = new Array();

            for (let i = 0; i < DataStorage.numbOfLevels; i++) {
                DataStorage.numbElemOnLevel.push(0);
            }
            for (let j = 0; j < newModel.dataPoints.length; j++) {
                let levelOfTheCurrentItem = 0;
                let temp = 0;
                levelOfTheCurrentItem = newModel.dataPoints[j].lvl;
                temp = DataStorage.numbElemOnLevel[levelOfTheCurrentItem];
                DataStorage.numbElemOnLevel[levelOfTheCurrentItem] = temp + 1;
            }
        }

        //The search for the number of levels, and the definition of each node its level
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
                boolSelectionId: false,
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
            if (newViewModel.dataPoints.length != 0) {
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
                DataStorage.criticalError = false;
                DataStorage.numbOfLevels = _lvl - 1;
            }
            else {
                DataStorage.criticalError = true;
                DataStorage.numbOfLevels = _lvl - 1;
            }
            return sortModel;
        }
    }
}