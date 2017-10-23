module powerbi.extensibility.visual.chart6F792A8745784877BCD8F4ACA5AD4207  {

    export  class WorkWithTeams {
        //Connection of element type with its color (color is determined by the user)
        public joiningCommandsWithColors(modelWithVisibleElements, viewModel: ViewModel) {
            let listTeams = this.countingTheNumberOfTeams(modelWithVisibleElements, viewModel);

            for (let i = 0; i < listTeams.teamModel.length; i++) {
                listTeams.teamModel[i].color = viewModel.teamSet[listTeams.teamModel[i].team].color;
            }
            return listTeams;
        }

        //Identify the type id to which the user belongs
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

        //counting the number of teams
        public countingTheNumberOfTeams(newModel: ViewModel, previousModel: ViewModel): TeamModelList {
            let teamModelList: TeamModelList = {
                teamModel: []
            };
            let counter = 0;
            let isUniqueTeam;
            for (let i = 0; i < newModel.dataPoints.length; i++) {
                isUniqueTeam = true;
                if ((newModel.dataPoints[i].team == " ") || (newModel.dataPoints[i].team == null)) {
                    newModel.dataPoints[i].team = "";
                }
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
                        boolSelectionIds: false,
                        selectionIds: previousModel.teamSet[teamName].selectionIds || []
                    };
                    counter++;
                    teamModelList.teamModel.push(team);
                }
            }
            return teamModelList;
        }
    }
}