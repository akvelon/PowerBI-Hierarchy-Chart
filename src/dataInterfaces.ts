module powerbi.extensibility.visual {

    import ISelectionId = powerbi.visuals.ISelectionId;
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    export interface DataPoint {
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
        boolSelectionId: boolean;
        highlighted: boolean;
        elementWeight: number;
        parentStartX: number;
        nameOfHeader: string;
        tooltip: string;
    };

    export interface ViewModel {
        dataPoints: DataPoint[];
        teamSet?: TeamModelSet;
        highlights: boolean;
    };

    export interface TeamModelSet {
        [teamName: string]: TeamModel;
    }

    export interface TeamModel {
        team: string;
        teamId: number;
        color: string;
        boolSelectionIds: boolean;
        selectionIds: ISelectionId[];
    };

    export interface TeamModelList {
        teamModel: TeamModel[];
    };

    export interface ColumnIndex {
        category?: number;
        title?: number;
        reportTo?: number;
        team?: number;
        position?: number;
        tooltip?: number;
    }
}    